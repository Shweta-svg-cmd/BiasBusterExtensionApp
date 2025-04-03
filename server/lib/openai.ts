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
  biasScore: number; // -10 to 10, negative is conservative, positive is liberal
  biasAnalysis: string;
  neutralText: string;
  biasedPhrases: BiasedPhrase[];
};

export async function analyzeArticle(request: ArticleAnalysisRequest): Promise<{
  title: string;
  source?: string;
  content: string;
  biasScore: number;
  biasAnalysis: string;
  neutralText: string;
  biasedPhrases: BiasedPhrase[];
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
    Analyze the following news article for political bias. The article is delimited by triple backticks.
    
    \`\`\`
    ${articleContent}
    \`\`\`
    
    Provide your analysis in JSON format with the following fields:
    - title: The title of the article (if not obvious, make a reasonable guess)
    - biasScore: A number from -10 (extremely conservative) to 10 (extremely liberal), with 0 being perfectly neutral
    - biasAnalysis: A 2-3 paragraph explanation of the bias you detected and why
    - neutralText: A rewrite of a portion of the article in completely neutral language
    - biasedPhrases: An array of objects with "text" (the biased phrase) and "explanation" (why it's biased)
    
    Focus on identifying loaded language, emotional appeals, opinion presented as fact, selective facts, framing, and labeling. Look at the overall tone and presentation, not just individual words.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content) as BiasAnalysisResponse;
    
    return {
      title: result.title || title,
      source,
      content: articleContent.substring(0, 1000), // Store a truncated version
      biasScore: result.biasScore,
      biasAnalysis: result.biasAnalysis,
      neutralText: result.neutralText,
      biasedPhrases: result.biasedPhrases,
    };
  } catch (error) {
    throw new Error(`Failed to analyze article: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function compareSources(request: SourceComparisonRequest): Promise<SourceComparisonResult[]> {
  try {
    const { topic, sources } = request;
    
    // Call OpenAI to generate comparison
    const prompt = `
    Generate a comparative analysis of how different news sources would cover the topic: "${topic}".
    
    For each of these news sources: ${sources.join(', ')}, create:
    1. A plausible headline they might use
    2. A bias score from -10 (extremely conservative) to 10 (extremely liberal)
    3. A brief description of their key narrative approach
    4. Three example sentences from their hypothetical coverage, highlighting biased language in <span> tags with appropriate classes:
       - Liberal bias: <span class="bg-green-100">liberal biased text</span>
       - Conservative bias: <span class="bg-red-100">conservative biased text</span>
    
    Format the response as a JSON array of objects, each with the properties:
    - source: string (the news source name)
    - headline: string (the hypothetical headline)
    - biasScore: number (the bias rating)
    - keyNarrative: string (brief description of narrative approach)
    - contentAnalysis: string[] (array of example content with spans marking bias)
    
    Be nuanced and realistic in your assessment, recognizing the actual editorial tendencies of each source.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Parse the result - ensuring it has the expected structure
    if (Array.isArray(result)) {
      return result as SourceComparisonResult[];
    } else if (result.results && Array.isArray(result.results)) {
      return result.results as SourceComparisonResult[];
    } else {
      throw new Error("Unexpected response format from analysis");
    }
  } catch (error) {
    throw new Error(`Failed to compare sources: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
