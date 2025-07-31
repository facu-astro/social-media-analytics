# Social Media Analytics Dashboard

A modern web application for analyzing social media performance using Sprout Social data and AI-powered strategy recommendations.

## Features

- **Quarterly Performance Analysis**: Compare current and previous quarter metrics
- **Visual Data Representation**: Interactive charts and graphs
- **AI Strategy Recommendations**: ChatGPT-powered suggestions for improvement
- **Professional Design**: Clean, marketing-team friendly interface
- **Error Handling**: Comprehensive error states and rate limit management

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in your project root with the following variables:

\`\`\`env
SPROUT_SOCIAL_API_TOKEN=your_sprout_social_api_token_here
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

### 2. Getting API Keys

#### Sprout Social API Token
1. Log in to your Sprout Social account
2. Navigate to Settings > API Access
3. Generate a new API token with the following permissions:
   - Read profiles
   - Read posts
   - Read analytics
4. Copy the token to your `.env.local` file

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env.local` file

### 3. API Endpoints

The application uses the following API endpoints:

- `POST /api/sprout-social/stats` - Fetches quarterly statistics
- `POST /api/openai/strategies` - Generates AI recommendations
- `GET /api/validate-keys` - Validates API credentials

### 4. Rate Limiting

The application handles rate limiting gracefully:

- **Sprout Social**: Respects API rate limits with exponential backoff
- **OpenAI**: Implements retry logic for rate limit errors
- **Error Handling**: Clear user feedback for rate limit issues

### 5. Data Flow

1. User enters Sprout Social profile ID
2. Application validates API keys
3. Fetches current and previous quarter data from Sprout Social
4. Sends performance data to OpenAI for strategy generation
5. Displays results with interactive charts and recommendations

## Usage

1. Enter your Sprout Social profile ID in the input field
2. Click "Analyze Performance" to start the analysis
3. View your quarterly comparison in the Overview tab
4. Explore detailed charts in the Quarter Comparison tab
5. Review AI-generated strategies in the AI Strategies tab
6. Export strategies for implementation planning

## Error Handling

The application provides clear feedback for common issues:

- **Missing API Keys**: Prompts to configure environment variables
- **Invalid Credentials**: Suggests checking API key validity
- **Rate Limits**: Advises waiting before retrying
- **Network Errors**: Suggests checking internet connection
- **Profile Not Found**: Validates Sprout Social profile ID

## Technical Details

- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI server with CORS support
- **Styling**: Tailwind CSS with shadcn/ui components
- **Charts**: Recharts for data visualization
- **AI Integration**: OpenAI GPT-3.5/4 via Python OpenAI SDK
- **API Integration**: Sprout Social REST API
- **Error Handling**: Comprehensive error states and retry logic

## Deployment

### Frontend (Vercel)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `BACKEND_URL`: Your deployed backend URL

### Backend (Railway/Render)
1. Create new service on Railway or Render
2. Connect GitHub repository
3. Set root directory to `backend`
4. Add environment variables:
   - `SPROUT_API_KEY`: Your Sprout Social API key
   - `OPENAI_API_KEY`: Your OpenAI API key

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python api_server.py
```

### Frontend
```bash
npm install
npm run dev
```
