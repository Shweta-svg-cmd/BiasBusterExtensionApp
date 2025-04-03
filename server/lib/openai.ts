import OpenAI from "openai";
import { ArticleAnalysisRequest, BiasedPhrase, SourceComparisonRequest, SourceComparisonResult } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Function to extract text from URL
async function extractTextFromUrl(url: string): Promise<{
  title: string;
  source: string;
  content: string;
}> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "Untitled Article";
    
    // Extract domain as source
    const urlObj = new URL(url);
    let source = urlObj.hostname.replace('www.', '');
    
    // Map common news domains to their names
    const sourceMap: Record<string, string> = {
      'nytimes.com': 'New York Times',
      'wsj.com': 'Wall Street Journal',
      'foxnews.com': 'Fox News',
      'cnn.com': 'CNN',
      'npr.org': 'NPR',
      'bbc.com': 'BBC',
      'washingtonpost.com': 'Washington Post',
      'theguardian.com': 'The Guardian',
    };
    
    Object.entries(sourceMap).forEach(([domain, name]) => {
      if (source.includes(domain)) {
        source = name;
      }
    });
    
    // Simple content extraction - in a real app, use a proper scraper or API
    // Strip HTML tags but keep some whitespace structure
    let content = html
      .replace(/<style([\s\S]*?)<\/style>/gi, '')
      .replace(/<script([\s\S]*?)<\/script>/gi, '')
      .replace(/<header([\s\S]*?)<\/header>/gi, '')
      .replace(/<footer([\s\S]*?)<\/footer>/gi, '')
      .replace(/<nav([\s\S]*?)<\/nav>/gi, '')
      .replace(/<aside([\s\S]*?)<\/aside>/gi, '')
      .replace(/<[^>]+>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take a reasonable amount of content (this is a simplified approach)
    content = content.substring(0, 8000);
    
    return {
      title,
      source,
      content
    };
  } catch (error) {
    throw new Error(`Failed to extract text from URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

type BiasAnalysisResponse = {
  title: string;
  biasScore: number; // 0 to 100, with 0 being completely unbiased
  politicalLeaning: string; // "Conservative" | "Liberal" | "Centrist"
  emotionalLanguage: string; // "Low" | "Moderate" | "High"
  factualReporting: string; // "Low" | "Moderate" | "High"
  biasAnalysis: string;
  neutralText: string;
  biasedPhrases: BiasedPhrase[];
  topics: {
    main: string;
    related: string[];
  };
  multidimensionalAnalysis: {
    bias: number; // 0-100
    emotional: number; // 0-100
    factual: number; // 0-100
    political: number; // 0-100
    neutralLanguage: number; // 0-100
  };
};

export async function analyzeArticle(request: ArticleAnalysisRequest): Promise<{
  title: string;
  source?: string;
  content: string;
  biasScore: number;
  biasAnalysis: string;
  neutralText: string;
  biasedPhrases: BiasedPhrase[];
  politicalLeaning: string;
  emotionalLanguage: string;
  factualReporting: string;
  topics: {
    main: string;
    related: string[];
  };
  multidimensionalAnalysis: {
    bias: number;
    emotional: number;
    factual: number;
    political: number;
    neutralLanguage: number;
  };
}> {
  try {
    let articleContent: string;
    let title: string;
    let source: string | undefined;
    
    // Extract content from URL or use provided text
    if (request.url) {
      const extractedData = await extractTextFromUrl(request.url);
      articleContent = extractedData.content;
      title = extractedData.title;
      source = extractedData.source;
    } else if (request.text) {
      articleContent = request.text;
      // Try to extract a title from the first line of text
      const lines = articleContent.split('\n');
      title = lines[0].length > 10 && lines[0].length < 200 
        ? lines[0] 
        : "Untitled Article";
    } else {
      throw new Error("Either URL or text must be provided");
    }

    // Call OpenAI for analysis
    const prompt = `
    Analyze the following news article for political bias and provide a comprehensive evaluation. The article is delimited by triple backticks.
    
    \`\`\`
    ${articleContent}
    \`\`\`
    
    Provide your analysis in JSON format with the following fields:
    - title: The title of the article (if not obvious, make a reasonable guess)
    - biasScore: A number from 0 (completely unbiased) to 100 (extremely biased)
    - politicalLeaning: One of "Conservative", "Liberal", or "Centrist"
    - emotionalLanguage: One of "Low", "Moderate", or "High"
    - factualReporting: One of "Low", "Moderate", or "High"
    - biasAnalysis: A 2-3 paragraph explanation of the bias you detected and why
    - neutralText: A complete rewrite of the ENTIRE article in neutral, objective language. Maintain all factual information but remove any bias, loaded language, or partisan framing.
    - biasedPhrases: An array of objects with "text" (the biased phrase) and "explanation" (why it's biased)
    - topics: An object with "main" (the primary topic) and "related" (an array of related topics like "Politics", "Economy", "Crime", etc.)
    - multidimensionalAnalysis: An object with numeric scores from 0-100 for these dimensions:
        * bias: Overall bias level (0=unbiased, 100=extremely biased)
        * emotional: Use of emotional language (0=purely factual, 100=highly emotional)
        * factual: Factual accuracy (0=opinion-based, 100=strictly factual)
        * political: Political slant (0=no political angle, 100=heavily political)
        * neutralLanguage: Use of neutral language (0=heavily loaded language, 100=completely neutral)
    
    Focus on identifying loaded language, emotional appeals, opinion presented as fact, selective facts, framing, and labeling. Look at the overall tone and presentation, not just individual words.
    
    It is CRITICAL that the neutralText field contains a COMPLETE rewrite of the entire article, not just a portion of it.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}") as BiasAnalysisResponse;
    
    return {
      title: result.title || title,
      source,
      content: articleContent.substring(0, 1000), // Store a truncated version
      biasScore: result.biasScore,
      biasAnalysis: result.biasAnalysis,
      neutralText: result.neutralText,
      biasedPhrases: result.biasedPhrases,
      politicalLeaning: result.politicalLeaning || "Centrist",
      emotionalLanguage: result.emotionalLanguage || "Moderate",
      factualReporting: result.factualReporting || "Moderate",
      topics: result.topics || { main: "General", related: [] },
      multidimensionalAnalysis: result.multidimensionalAnalysis || {
        bias: 50,
        emotional: 50,
        factual: 50,
        political: 50,
        neutralLanguage: 50
      }
    };
  } catch (error) {
    throw new Error(`Failed to analyze article: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

import { fetchArticlesFromSources } from "./newsapi";

export async function compareSources(request: SourceComparisonRequest): Promise<SourceComparisonResult[]> {
  try {
    const { topic, sources } = request;
    
    // Fetch real articles from NewsAPI
    const sourceArticles = await fetchArticlesFromSources(request);
    
    // Prepare content for OpenAI analysis
    const analysisPrompt = `
    Analyze the coverage of the topic "${topic}" from different news sources.
    
    I'll provide actual headlines and excerpts from each source. For each source, analyze:
    1. The bias score (0-100, where 0 is completely neutral and 100 is extremely biased)
    2. The key narrative approach they're taking
    3. Their political leaning (Conservative, Liberal, or Centrist)
    4. Identify key content that demonstrates their approach or bias
    
    Here are the articles from each source:
    ${Object.entries(sourceArticles).map(([source, articles]) => {
      if (!articles.length) return `${source}: No articles found`;
      
      return `
      ${source}:
      Headline: ${articles[0].title}
      Content: ${articles[0].description} ${articles[0].content?.slice(0, 300)}...
      `;
    }).join('\n\n')}
    
    Format your response as a JSON object with a "results" array containing objects with these properties for each source:
    - source: string (news source name)
    - headline: string (the actual headline)
    - biasScore: number (bias rating from 0-100)
    - keyNarrative: string (brief description of narrative approach)
    - contentAnalysis: string[] (array of key phrases/sentences that show the bias or approach)
    - politicalLeaning: string (one of "Conservative", "Liberal", or "Centrist")
    `;

    // Call OpenAI to analyze the real articles
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: analysisPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Parse the result - ensuring it has the expected structure
    if (Array.isArray(result)) {
      return result as SourceComparisonResult[];
    } else if (result.results && Array.isArray(result.results)) {
      return result.results as SourceComparisonResult[];
    } else {
      throw new Error("Unexpected response format from analysis");
    }
  } catch (error) {
    console.error("Error comparing sources:", error);
    throw new Error(`Failed to compare sources: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
