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

    # Generate data-driven strategies based on the analysis
    strategies = []

    # Strategy 1: Engagement optimization
    if total_likes_q2 < total_likes_q1:
        strategies.append({
            "id": 1,
            "title": "Boost Engagement Through Interactive Content",
            "description": f"Your likes decreased by {abs(likes_change):.1f}%. Focus on creating more interactive content like polls, Q&As, and user-generated content campaigns to re-engage your audience.",
            "category": "Engagement",
            "priority": "High",
            "implementation_time": "1-2 weeks",
            "expected_impact": "15-25% increase in engagement rates",
            "action_items": [
                "Create weekly interactive polls and Q&A sessions",
                "Launch user-generated content campaigns",
                "Respond to comments within 2 hours during business hours"
            ],
            "metrics_to_track": ["Likes", "Comments", "Engagement Rate"]
        })
    else:
        strategies.append({
            "id": 1,
            "title": "Maintain Current Engagement Strategy",
            "description": f"Your likes increased by {likes_change:.1f}%. Continue your current engagement approach while exploring new interactive formats.",
            "category": "Engagement",
            "priority": "Medium",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Sustained engagement growth",
            "action_items": [
                "Analyze top-performing content formats",
                "Experiment with new interactive features",
                "Maintain consistent posting schedule"
            ],
            "metrics_to_track": ["Likes", "Engagement Rate", "Reach"]
        })

    # Strategy 2: Content reach optimization
    if total_impressions_q2 < total_impressions_q1:
        strategies.append({
            "id": 2,
            "title": "Increase Content Reach and Visibility",
            "description": f"Your impressions decreased by {abs(impressions_change):.1f}%. Optimize posting times and use trending hashtags to improve content visibility.",
            "category": "Growth",
            "priority": "High",
            "implementation_time": "1-2 weeks",
            "expected_impact": "20-30% increase in reach and impressions",
            "action_items": [
                "Analyze audience activity patterns and optimize posting times",
                "Research and use trending hashtags in your industry",
                "Cross-promote content across different platforms"
            ],
            "metrics_to_track": ["Impressions", "Reach", "Hashtag Performance"]
        })
    else:
        strategies.append({
            "id": 2,
            "title": "Scale Content Distribution Strategy",
            "description": f"Your impressions increased by {impressions_change:.1f}%. Build on this success by expanding your content distribution strategy.",
            "category": "Growth",
            "priority": "Medium",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Continued reach expansion",
            "action_items": [
                "Identify peak performance times and increase posting frequency",
                "Explore new content formats and platforms",
                "Develop partnerships for content amplification"
            ],
            "metrics_to_track": ["Impressions", "Reach", "Follower Growth"]
        })

    # Strategy 3: Shareability improvement
    if total_shares_q2 < total_shares_q1:
        strategies.append({
            "id": 3,
            "title": "Create More Shareable Content",
            "description": f"Your shares decreased by {abs(shares_change):.1f}%. Focus on creating valuable, shareable content that your audience wants to spread.",
            "category": "Content",
            "priority": "High",
            "implementation_time": "2-4 weeks",
            "expected_impact": "25-40% increase in content shares",
            "action_items": [
                "Create educational and informative content",
                "Design visually appealing infographics and quotes",
                "Develop content series that encourage sharing"
            ],
            "metrics_to_track": ["Shares", "Viral Coefficient", "Content Saves"]
        })
    else:
        strategies.append({
            "id": 3,
            "title": "Amplify Shareable Content Strategy",
            "description": f"Your shares increased by {shares_change:.1f}%. Continue creating shareable content while exploring new formats.",
            "category": "Content",
            "priority": "Medium",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Sustained sharing growth",
            "action_items": [
                "Analyze most shared content for patterns",
                "Create content templates for consistent shareability",
                "Encourage sharing through call-to-actions"
            ],
            "metrics_to_track": ["Shares", "Content Performance", "Audience Growth"]
        })

    # Strategy 4: Community engagement
    if total_comments_q2 < total_comments_q1:
        strategies.append({
            "id": 4,
            "title": "Improve Community Response Strategy",
            "description": f"Your comments decreased by {abs(comments_change):.1f}%. Focus on building stronger community relationships through active engagement.",
            "category": "Community",
            "priority": "Medium",
            "implementation_time": "1-2 weeks",
            "expected_impact": "Stronger community relationships and loyalty",
            "action_items": [
                "Implement faster response times to comments",
                "Ask questions in posts to encourage discussion",
                "Create community-focused content and events"
            ],
            "metrics_to_track": ["Comments", "Response Rate", "Community Sentiment"]
        })
    else:
        strategies.append({
            "id": 4,
            "title": "Scale Community Engagement",
            "description": f"Your comments increased by {comments_change:.1f}%. Build on this community engagement success.",
            "category": "Community",
            "priority": "Low",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Enhanced community loyalty",
            "action_items": [
                "Maintain current engagement levels",
                "Explore community-building initiatives",
                "Recognize and reward active community members"
            ],
            "metrics_to_track": ["Comments", "Community Growth", "User Retention"]
        })

    # Strategy 5: Analytics and optimization
    strategies.append({
        "id": 5,
        "title": "Implement Data-Driven Content Optimization",
        "description": "Use performance analytics to continuously improve your social media strategy and content effectiveness.",
        "category": "Analytics",
        "priority": "Low",
        "implementation_time": "3+ months",
        "expected_impact": "Long-term strategic improvements",
        "action_items": [
            "Set up comprehensive analytics tracking",
            "Create monthly performance reports",
            "A/B test different content formats and posting times"
        ],
        "metrics_to_track": ["Overall Performance Score", "Content ROI", "Audience Growth Rate"]
    })

    return json.dumps({"strategies": strategies}, indent=2)

def generate_strategy(report_data, retry_count=0):
    try:
        # Extract data
        custom_prompt = report_data.get('custom_prompt', '')
        okr = report_data.get('okr', '')
        profiles_data = report_data.get('profiles', [])

        # Build comprehensive prompt for structured strategy response
        base_prompt = f"""Analyze this social media performance data and provide exactly 5 specific, actionable strategies for improvement.

Data: {json.dumps(profiles_data, indent=2)}"""

        if okr:
            base_prompt += f"\n\nAlign strategies with this OKR: {okr}"

        if custom_prompt:
            base_prompt += f"\n\nAdditional context: {custom_prompt}"

        base_prompt += """

Please respond with a valid JSON object containing exactly 5 strategies. Use this exact format:

{
  "strategies": [
    {
      "id": 1,
      "title": "Clear, actionable strategy title",
      "description": "Detailed explanation of the strategy and why it's important",
      "category": "Content|Engagement|Growth|Analytics|Community",
      "priority": "High|Medium|Low",
      "implementation_time": "1-2 weeks|2-4 weeks|1-2 months|3+ months",
      "expected_impact": "Brief description of expected results",
      "action_items": [
        "Specific action item 1",
        "Specific action item 2",
        "Specific action item 3"
      ],
      "metrics_to_track": [
        "Metric 1",
        "Metric 2"
      ]
    }
  ]
}

Focus on specific, measurable actions based on the performance data provided. Ensure each strategy has a clear title, detailed description, and actionable steps."""

        models = [
            {"name": "gpt-3.5-turbo", "max_tokens": 3000},
            {"name": "gpt-3.5-turbo", "max_tokens": 2048},
            {"name": "gpt-3.5-turbo", "max_tokens": 1024}
        ]

        model_config = models[retry_count]

        response = client.chat.completions.create(
            model=model_config["name"],
            messages=[
                {"role": "system", "content": "You are a social media strategy expert. Always respond with valid JSON containing exactly 5 detailed, actionable strategies. Never include markdown formatting or code blocks in your response - only pure JSON."},
                {"role": "user", "content": base_prompt}
            ],
            temperature=0.7,
            max_tokens=model_config["max_tokens"]
        )

        strategy_response = response.choices[0].message.content.strip()

        # Try to parse as JSON first
        try:
            # Clean up any markdown formatting
            if strategy_response.startswith('```'):
                strategy_response = strategy_response.split('```')[1]
                if strategy_response.startswith('json'):
                    strategy_response = strategy_response[4:]

            parsed_json = json.loads(strategy_response)
            return json.dumps(parsed_json, indent=2)
        except json.JSONDecodeError:
            # Fallback to text parsing if JSON parsing fails
            return parse_text_strategies_to_json(strategy_response)

    except Exception as e:
        print(f"OpenAI API error: {str(e)}")
        if "insufficient_quota" in str(e) and retry_count < len(models) - 1:
            return generate_strategy(report_data, retry_count + 1)
        return generate_fallback_strategies(report_data)

def parse_text_strategies_to_json(text_response):
    """Parse text-based strategy response into structured JSON format"""
    strategies = []
    lines = text_response.split('\n')
    current_strategy = None
    strategy_count = 0

    categories = ["Content", "Engagement", "Growth", "Analytics", "Community"]
    priorities = ["High", "Medium", "Low"]

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Look for strategy headers
        if any(keyword in line.lower() for keyword in ['strategy', 'recommendation']) and len(line) > 20:
            if current_strategy and strategy_count < 5:
                strategies.append(current_strategy)

            strategy_count += 1
            if strategy_count > 5:
                break

            current_strategy = {
                "id": strategy_count,
                "title": f"Strategy {strategy_count}",
                "description": line.replace(f"Strategy {strategy_count}:", "").strip(),
                "category": categories[strategy_count % len(categories)],
                "priority": priorities[0 if strategy_count <= 2 else 1 if strategy_count <= 4 else 2],
                "implementation_time": "2-4 weeks",
                "expected_impact": "Improved social media performance",
                "action_items": [],
                "metrics_to_track": ["Engagement Rate", "Reach"]
            }
        elif current_strategy and len(line) > 30:
            # Add substantial lines to description
            if len(current_strategy["description"]) < 200:
                current_strategy["description"] += " " + line

    # Add the last strategy
    if current_strategy and len(strategies) < 5:
        strategies.append(current_strategy)

    # Ensure we have exactly 5 strategies
    while len(strategies) < 5:
        strategies.append({
            "id": len(strategies) + 1,
            "title": f"Additional Strategy {len(strategies) + 1}",
            "description": "Focus on improving overall social media performance through data-driven decisions.",
            "category": categories[len(strategies) % len(categories)],
            "priority": "Medium",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Enhanced social media metrics",
            "action_items": ["Analyze current performance", "Implement improvements", "Monitor results"],
            "metrics_to_track": ["Engagement Rate", "Reach"]
        })

    return json.dumps({"strategies": strategies[:5]}, indent=2)

def generate_fallback_strategies(report_data):
    """Generate fallback strategies when AI fails"""
    profiles_data = report_data.get('profiles', [])

    fallback_strategies = [
        {
            "id": 1,
            "title": "Optimize Content Timing",
            "description": "Analyze your audience's most active hours and schedule posts during peak engagement times to maximize reach and interaction.",
            "category": "Content",
            "priority": "High",
            "implementation_time": "1-2 weeks",
            "expected_impact": "15-25% increase in engagement rates",
            "action_items": [
                "Review analytics for peak audience activity",
                "Schedule posts during high-engagement windows",
                "Test different posting times and measure results"
            ],
            "metrics_to_track": ["Engagement Rate", "Reach", "Impressions"]
        },
        {
            "id": 2,
            "title": "Enhance Visual Content Strategy",
            "description": "Develop a consistent visual brand identity and increase the use of high-quality images, videos, and graphics to improve engagement.",
            "category": "Content",
            "priority": "High",
            "implementation_time": "2-4 weeks",
            "expected_impact": "20-30% improvement in visual content engagement",
            "action_items": [
                "Create brand visual guidelines",
                "Invest in quality visual content creation",
                "A/B test different visual formats"
            ],
            "metrics_to_track": ["Engagement Rate", "Shares", "Comments"]
        },
        {
            "id": 3,
            "title": "Improve Community Engagement",
            "description": "Actively respond to comments, engage with followers' content, and create interactive posts to build a stronger community.",
            "category": "Community",
            "priority": "Medium",
            "implementation_time": "1-2 weeks",
            "expected_impact": "Stronger community relationships and loyalty",
            "action_items": [
                "Set up engagement response schedule",
                "Create interactive content (polls, Q&As)",
                "Engage with followers' content regularly"
            ],
            "metrics_to_track": ["Comments", "Response Rate", "Community Growth"]
        },
        {
            "id": 4,
            "title": "Leverage User-Generated Content",
            "description": "Encourage and showcase user-generated content to increase authenticity and community involvement.",
            "category": "Community",
            "priority": "Medium",
            "implementation_time": "2-4 weeks",
            "expected_impact": "Increased authenticity and community engagement",
            "action_items": [
                "Create UGC campaigns and hashtags",
                "Feature customer content regularly",
                "Incentivize content creation with contests"
            ],
            "metrics_to_track": ["UGC Submissions", "Hashtag Usage", "Community Engagement"]
        },
        {
            "id": 5,
            "title": "Implement Data-Driven Content Planning",
            "description": "Use analytics to identify top-performing content types and create more of what resonates with your audience.",
            "category": "Analytics",
            "priority": "Low",
            "implementation_time": "3+ months",
            "expected_impact": "More strategic and effective content creation",
            "action_items": [
                "Analyze historical content performance",
                "Identify patterns in successful posts",
                "Create content calendar based on insights"
            ],
            "metrics_to_track": ["Content Performance Score", "Engagement Trends", "Audience Growth"]
        }
    ]

    return json.dumps({"strategies": fallback_strategies}, indent=2)

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
