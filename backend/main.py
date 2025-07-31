from datetime import datetime
import os
import json
import requests
from datetime import datetime, timedelta
from openai import OpenAI
import time

# Load API keys from environment variables or config file
SPROUT_API_KEY = os.environ.get('SPROUT_API_KEY')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Fallback to config file if environment variables are not set
if not SPROUT_API_KEY or not OPENAI_API_KEY:
    try:
        with open('config.json') as f:
            config = json.load(f)
        SPROUT_API_KEY = SPROUT_API_KEY or config.get('sprout_api_key')
        OPENAI_API_KEY = OPENAI_API_KEY or config.get('openai_api_key')
    except FileNotFoundError:
        print("Warning: config.json not found and environment variables not set")

if not SPROUT_API_KEY:
    raise ValueError("SPROUT_API_KEY environment variable or config.json sprout_api_key is required")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable or config.json openai_api_key is required")

# Configure OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

# Configure OpenAI

# Sprout Social API setup
BASE_URL = 'https://api.sproutsocial.com/v1'
HEADERS = {
    'Authorization': f'Bearer {SPROUT_API_KEY}',  # Always use Bearer prefix
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

def track_token_usage(tokens_used):
    """Track daily token usage"""
    usage_file = 'token_usage.json'
    today = datetime.now().strftime('%Y-%m-%d')
    
    try:
        if os.path.exists(usage_file):
            with open(usage_file, 'r') as f:
                usage = json.load(f)
        else:
            usage = {}
        
        usage[today] = usage.get(today, 0) + tokens_used
        
        with open(usage_file, 'w') as f:
            json.dump(usage, f)
            
        print(f"\nDaily token usage: {usage[today]} tokens")
        if usage[today] > 50000:  # Warning at 10% of monthly free tier
            print("Warning: Approaching daily token usage limit!")
            
    except Exception as e:
        print(f"Error tracking token usage: {e}")

# First get customer ID
def get_customer_id():
    url = f"{BASE_URL}/metadata/client"
    print(f"Getting customer ID from: {url}")

    # Try first without Bearer prefix
    print("\nTrying without Bearer prefix...")
    headers = HEADERS.copy()
    print(f"Using headers: {json.dumps({k: v[:20] + '...' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")

    response = requests.get(url, headers=headers)
    print(f"Response status code: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")

    # If first attempt fails, try with Bearer prefix
    if response.status_code == 401:
        print("\nTrying with Bearer prefix...")
        headers['Authorization'] = f'Bearer {SPROUT_API_KEY}'
        print(f"Using headers: {json.dumps({k: v[:20] + '...' if k == 'Authorization' else v for k, v in headers.items()}, indent=2)}")

        response = requests.get(url, headers=headers)
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

    if response.status_code != 200:
        print(f"Error response body: {response.text}")
        if response.status_code == 401:
            print("\nAuthorization failed. Please check:")
            print("1. Your API key is correct and active in Sprout Social")
            print("2. You have accepted the API Terms of Service in Sprout Social settings")
            print("3. Your account has API access enabled")
            print("4. You have the API Permissions permission in your Sprout Social account")
        raise Exception(f"API Error: {response.status_code} - {response.text}")

    data = response.json()
    if not data.get('data') or not data['data'][0].get('customer_id'):
        raise Exception("No customer ID found in response")
    return data['data'][0]['customer_id']

# Example: List available profiles
def list_profiles():
    # First get the customer ID
    customer_id = get_customer_id()

    url = f"{BASE_URL}/{customer_id}/metadata/customer"
    print(f"\nGetting profiles from: {url}")
    print(f"Using headers: {json.dumps({k: v[:20] + '...' if k == 'Authorization' else v for k, v in HEADERS.items()}, indent=2)}")

    response = requests.get(url, headers=HEADERS)
    print(f"Response status code: {response.status_code}")
    print(f"Response headers: {dict(response.headers)}")

    if response.status_code != 200:
        print(f"Error response body: {response.text}")
        raise Exception(f"API Error: {response.status_code} - {response.text}")
    return response.json()

# Example: Fetch profile stats
def get_profile_stats(profile_id, start_date, end_date):
    # Get list of available profiles first
    try:
        profiles = list_profiles()
        print("\nAvailable profiles:")
        for profile in profiles.get('profiles', []):
            print(f"ID: {profile.get('id')}, Name: {profile.get('name')}")
    except Exception as e:
        print(f"Could not fetch profiles list: {str(e)}")

    # Get customer ID first if not already fetched
    customer_id = get_customer_id()

    # Then get the stats using POST request as per documentation
    url = f"{BASE_URL}/{customer_id}/analytics/profiles"
    data = {
        "filters": [
            f"customer_profile_id.eq({profile_id})",
            f"reporting_period.in({start_date}...{end_date})"
        ],
        "metrics": [
            "impressions",
            "likes",
            "reactions",
            "comments_count",
            "shares_count"
        ]
    }
    response = requests.post(url, headers=HEADERS, json=data)
    if response.status_code != 200:
        raise Exception(f"API Error: {response.status_code} - {response.text}")
    return response.json()

# Example: Compare quarters
def compare_quarters(stats_q1, stats_q2):
    comparison = {}
    for key in stats_q1:
        # Convert string values to float if they are numeric
        try:
            q1_value = float(stats_q1[key]) if isinstance(stats_q1[key], (str, int)) else stats_q1[key]
            q2_value = float(stats_q2[key]) if isinstance(stats_q2[key], (str, int)) else stats_q2[key]
            change = q2_value - q1_value
        except (ValueError, TypeError):
            # If conversion fails, store the original values and set change to None
            q1_value = stats_q1[key]
            q2_value = stats_q2[key]
            change = 'N/A'

        comparison[key] = {
            'Q1': q1_value,
            'Q2': q2_value,
            'Change': change
        }
    return comparison

# Example: Check OKR status
def check_okr_status(current, target):
    return current >= target

# Example: Get top post
def get_top_post(posts):
    return max(posts, key=lambda x: x['engagement'])

# ChatGPT integration
def analyze_data(data):
    """Basic data analysis without using OpenAI API"""
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except json.JSONDecodeError:
            # If it's not valid JSON, return a basic message
            return "Could not parse data for analysis. Using default recommendations:\n1. Focus on creating engaging content\n2. Maintain regular posting schedule\n3. Engage with your audience through comments and replies\n4. Track your metrics regularly"

    total_likes_q1 = 0
    total_likes_q2 = 0
    total_comments_q1 = 0
    total_comments_q2 = 0
    total_shares_q1 = 0
    total_shares_q2 = 0
    total_impressions_q1 = 0
    total_impressions_q2 = 0

    # Calculate totals for Q1
    if 'Q1' in data.get('data', {}):
        for day in data['data']['Q1']:
            metrics = day.get('metrics', {})
            total_likes_q1 += metrics.get('likes', 0)
            total_comments_q1 += metrics.get('comments_count', 0)
            total_shares_q1 += metrics.get('shares_count', 0)
            total_impressions_q1 += metrics.get('impressions', 0)

    # Calculate totals for Q2
    if 'Q2' in data.get('data', {}):
        for day in data['data']['Q2']:
            metrics = day.get('metrics', {})
            total_likes_q2 += metrics.get('likes', 0)
            total_comments_q2 += metrics.get('comments_count', 0)
            total_shares_q2 += metrics.get('shares_count', 0)
            total_impressions_q2 += metrics.get('impressions', 0)

    # Calculate changes
    likes_change = ((total_likes_q2 - total_likes_q1) / total_likes_q1 * 100) if total_likes_q1 > 0 else float('inf')
    comments_change = ((total_comments_q2 - total_comments_q1) / total_comments_q1 * 100) if total_comments_q1 > 0 else float('inf')
    shares_change = ((total_shares_q2 - total_shares_q1) / total_shares_q1 * 100) if total_shares_q1 > 0 else float('inf')
    impressions_change = ((total_impressions_q2 - total_impressions_q1) / total_impressions_q1 * 100) if total_impressions_q1 > 0 else float('inf')

    # Format percentages, handling infinite values
    def format_change(change):
        return "N/A" if change == float('inf') else f"{change:.1f}%"

    report = {
        'metrics': {
            'likes': {
                'q1': total_likes_q1,
                'q2': total_likes_q2,
                'change': format_change(likes_change)
            },
            'comments': {
                'q1': total_comments_q1,
                'q2': total_comments_q2,
                'change': format_change(comments_change)
            },
            'shares': {
                'q1': total_shares_q1,
                'q2': total_shares_q2,
                'change': format_change(shares_change)
            },
            'impressions': {
                'q1': total_impressions_q1,
                'q2': total_impressions_q2,
                'change': format_change(impressions_change)
            }
        }
    }

    return f"""Analysis Report:
---------------
Q1 vs Q2 Comparison:

Likes:
- Q1: {total_likes_q1}
- Q2: {total_likes_q2}
- Change: {report['metrics']['likes']['change']}

Comments:
- Q1: {total_comments_q1}
- Q2: {total_comments_q2}
- Change: {report['metrics']['comments']['change']}

Shares:
- Q1: {total_shares_q1}
- Q2: {total_shares_q2}
- Change: {report['metrics']['shares']['change']}

Impressions:
- Q1: {total_impressions_q1:,}
- Q2: {total_impressions_q2:,}
- Change: {report['metrics']['impressions']['change']}

Recommendations:
1. {"Focus on increasing engagement through interactive content." if total_likes_q2 < total_likes_q1 else "Continue the current engagement strategy."}
2. {"Increase posting frequency to improve impressions." if total_impressions_q2 < total_impressions_q1 else "Maintain current posting schedule."}
3. {"Work on creating more shareable content." if total_shares_q2 < total_shares_q1 else "Continue creating shareable content."}
4. {"Improve response rate to comments." if total_comments_q2 < total_comments_q1 else "Maintain current community engagement level."}
"""
    return report

def generate_strategy(report_data, retry_count=0):
    try:
        # Model configuration with token limits
        models = [
            {"name": "gpt-3.5-turbo", "max_tokens": 2048},  # First attempt (safely under 4K limit)
            {"name": "gpt-3.5-turbo", "max_tokens": 1024},  # First fallback
            {"name": "gpt-3.5-turbo", "max_tokens": 512}    # Second fallback
        ]
        
        # Add token count estimation before making the API call
        prompt = f"""Based on this social media report: {json.dumps(report_data, indent=2)}
        Analyze the engagement trends and suggest a strategy for next quarter. 
        Include specific recommendations for content and posting frequency."""
        
        # Estimate token count (rough estimate: 4 chars ≈ 1 token)
        estimated_tokens = len(prompt) // 4
        print(f"\nEstimated prompt tokens: {estimated_tokens}")
        
        if estimated_tokens > 3000:  # Leave room for response
            print("Warning: Input may exceed token limit. Truncating report...")
            # Truncate the report data to fit within limits
            report_data = str(report_data)[:8000]  # Rough truncation to stay within limits

        if retry_count >= len(models):
            print("\nAll model attempts failed. Falling back to basic analysis...")
            return analyze_data(report_data)
            
        model_config = models[retry_count]
        print(f"\nAttempting with model: {model_config['name']} (max tokens: {model_config['max_tokens']})")

        # Generate response using OpenAI
        response = client.chat.completions.create(
            model=model_config["name"],
            messages=[
                {"role": "system", "content": "You are a social media strategy expert analyzing quarterly performance data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=model_config["max_tokens"])

        # Print usage information
        if hasattr(response, 'usage'):
            usage = response.usage
            # Log detailed usage information
            print("\nAPI Usage Statistics:")
            print(f"Prompt Tokens: {usage.prompt_tokens}")
            print(f"Completion Tokens: {usage.completion_tokens}")
            print(f"Total Tokens: {usage.total_tokens}")
            
            # Calculate costs based on model
            model_costs = {
                "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},     # $0.0015/$0.002 per 1K tokens
                "gpt-4": {"input": 0.03, "output": 0.06},                # $0.03/$0.06 per 1K tokens
                "gpt-4-32k": {"input": 0.06, "output": 0.12},           # $0.06/$0.12 per 1K tokens
            }
            
            model_pricing = model_costs.get(response.model, model_costs["gpt-3.5-turbo"])
            input_cost = (usage.prompt_tokens / 1000) * model_pricing["input"]
            output_cost = (usage.completion_tokens / 1000) * model_pricing["output"]
            total_cost = input_cost + output_cost
            
            print(f"\nDetailed Cost Breakdown:")
            print(f"Input Cost (${model_pricing['input']}/1K tokens): ${input_cost:.4f}")
            print(f"Output Cost (${model_pricing['output']}/1K tokens): ${output_cost:.4f}")
            print(f"Total Cost: ${total_cost:.4f}")
            
            # Log request details
            print(f"\nRequest Details:")
            print(f"Request ID: {response.id}")
            print(f"Model Used: {response.model}")
            print(f"Creation Timestamp: {response.created}")

            track_token_usage(response.usage.total_tokens)
            
            return response.choices[0].message.content
            
    except Exception as e:
        if "insufficient_quota" in str(e) and retry_count < len(models):
            print(f"\nQuota exceeded. Retrying with reduced tokens...")
            return generate_strategy(report_data, retry_count + 1)
        print(f"\nError in strategy generation: {str(e)}")
        return analyze_data(report_data)
    except Exception as e:
        print(f"\nCould not generate AI strategy: {str(e)}")
        print("Falling back to basic data analysis...")
        return analyze_data(report_data)

def check_api_status():
    """Check OpenAI API key status"""
    try:
        # Test API with minimal tokens
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": "Hi"}
            ],
            max_tokens=1
        )
        print("✅ API key is working")
        return True
    except Exception as e:
        print("❌ API key status check failed:")
        print(f"Error: {str(e)}")
        if "insufficient_quota" in str(e):
            print("\nTo fix this:")
            print("1. Visit https://platform.openai.com/account/billing")
            print("2. Add payment method")
            print("3. Ensure you have available credits")
        return False

def rate_limit_check():
    """Implements rate limiting for API calls"""
    now = datetime.now()
    if not hasattr(rate_limit_check, 'calls'):
        rate_limit_check.calls = []
    
    # Remove calls older than 1 minute
    rate_limit_check.calls = [t for t in rate_limit_check.calls 
                            if now - t < timedelta(minutes=1)]
    
    if len(rate_limit_check.calls) >= 3:  # Free tier limit
        sleep_time = 60 - (now - rate_limit_check.calls[0]).seconds
        print(f"Rate limit reached. Waiting {sleep_time} seconds...")
        time.sleep(sleep_time)
        rate_limit_check.calls = []
    
    rate_limit_check.calls.append(now)

if __name__ == "__main__":
    try:
        if not check_api_status():
            raise Exception("API key validation failed")
        # Your Sprout Social profile ID
        profile_id = input("Enter your Sprout Social profile ID: ")

        # Get current and last quarter dates
        today = datetime.today()
        current_quarter_end = today.strftime('%Y-%m-%d')
        current_quarter_start = (today - timedelta(days=90)).strftime('%Y-%m-%d')
        last_quarter_end = (today - timedelta(days=90)).strftime('%Y-%m-%d')
        last_quarter_start = (today - timedelta(days=180)).strftime('%Y-%m-%d')

        # Fetch stats for both quarters
        print("Fetching stats...")
        stats_current = get_profile_stats(profile_id, current_quarter_start, current_quarter_end)
        stats_last = get_profile_stats(profile_id, last_quarter_start, last_quarter_end)

        # Compare quarters
        print("\nQuarter-to-Quarter Comparison:")
        comparison = compare_quarters(stats_last, stats_current)
        print(json.dumps(comparison, indent=2))

        # Generate strategy
        print("\nGenerating strategy recommendations...")
        report_summary = f"Quarter-to-quarter comparison shows the following changes: {json.dumps(comparison)}"
        strategy = generate_strategy(report_summary)
        print("\nStrategy for Next Quarter:")
        print(strategy)

    except Exception as e:
        print(f"Error: {str(e)}")