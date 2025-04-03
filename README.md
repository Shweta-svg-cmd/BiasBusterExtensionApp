# Bias Detector

A sophisticated news bias detection platform that leverages advanced algorithmic analysis to help users critically understand media representation and narrative framing.

![Bias Detector Screenshot](./generated-icon.png)

## Features

- AI-powered bias scoring system (using OpenAI GPT-4o)
- Real-time multi-source article analysis using NewsAPI
- Interactive visualization of media bias trends with radar charts
- Side-by-side comparison of biased vs. neutral language
- Machine learning-enhanced source comparison tools
- History tracking of analyzed articles
- Responsive design for desktop and mobile

## Deploying to Render

### Option 1: Deploy via Render Dashboard

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click on "New +" and select "Web Service"
4. Connect your GitHub account and select this repository
5. Configure the service:
   - **Name**: bias-detector (or your preferred name)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
6. Add the following environment variables:
   - `NODE_ENV`: production
   - `NEWSAPI_KEY`: Your NewsAPI key
   - `OPENAI_API_KEY`: Your OpenAI API key
7. Click "Create Web Service"

### Option 2: Deploy using render.yaml (Blueprint)

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click on "New +" and select "Blueprint"
4. Connect your GitHub account and select this repository
5. Render will automatically detect the `render.yaml` file and set up the services
6. You'll need to manually add the secret environment variables:
   - `NEWSAPI_KEY`: Your NewsAPI key
   - `OPENAI_API_KEY`: Your OpenAI API key

## Local Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   NEWSAPI_KEY=your_newsapi_key
   OPENAI_API_KEY=your_openai_api_key
   NODE_ENV=development
   PORT=5000
   ```
4. Start the development server: `npm run dev`
5. Open your browser to `http://localhost:5000`

## Usage

1. **Analysis Tab**: Paste a URL or text content to analyze bias
2. **Comparison Tab**: Enter a topic and select news sources to compare bias across outlets
3. **History Tab**: View and revisit previously analyzed articles

## API Requirements

- **NewsAPI**: Get your API key at [newsapi.org](https://newsapi.org)
- **OpenAI API**: Get your API key at [platform.openai.com](https://platform.openai.com/api-keys)

## Tech Stack

- Frontend: React, Tailwind CSS, shadcn/ui, Recharts
- Backend: Express.js
- APIs: OpenAI, NewsAPI
- Deployment: Render

## License

MIT