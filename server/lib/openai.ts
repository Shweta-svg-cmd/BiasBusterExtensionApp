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
    
    // Improved content extraction for better readability
    // First, try to extract the main article content
    let mainContent = '';
    
    // Look for common article containers
    const articleSelectors = [
      /<article.*?>([\s\S]*?)<\/article>/i,
      /<div.*?class=".*?(?:article|post|content|entry|main).*?".*?>([\s\S]*?)<\/div>/i,
      /<div.*?id=".*?(?:article|post|content|entry|main).*?".*?>([\s\S]*?)<\/div>/i,
      /<section.*?class=".*?(?:article|post|content|entry|main).*?".*?>([\s\S]*?)<\/section>/i
    ];
    
    // Try to extract content using each selector
    for (const selector of articleSelectors) {
      const match = html.match(selector);
      if (match && match[1] && match[1].length > 1000) { // Ensure we have substantial content
        mainContent = match[1];
        break;
      }
    }
    
    // If we couldn't extract specific article content, use the whole page but clean it
    let content = mainContent || html;
    
    // Clean the content
    content = content
      .replace(/<style([\s\S]*?)<\/style>/gi, '')
      .replace(/<script([\s\S]*?)<\/script>/gi, '')
      .replace(/<header([\s\S]*?)<\/header>/gi, '')
      .replace(/<footer([\s\S]*?)<\/footer>/gi, '')
      .replace(/<nav([\s\S]*?)<\/nav>/gi, '')
      .replace(/<aside([\s\S]*?)<\/aside>/gi, '')
      .replace(/<form([\s\S]*?)<\/form>/gi, '')
      .replace(/<iframe([\s\S]*?)<\/iframe>/gi, '')
      // Convert paragraph breaks to actual line breaks for better readability
      .replace(/<\/p>\s*<p/gi, '</p>\n<p')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/h[1-6]>/gi, '</h>\n')
      // Remove remaining HTML tags
      .replace(/<[^>]+>/gi, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Take a reasonable amount of content, focusing on the beginning where most article text is
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
    
    // Format and clean the article content for better display
    const cleanedContent = articleContent
      .split('\n')
      .filter(line => line.trim().length > 0)
      .join('\n\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Prepare a proper, readable article excerpt for storage and display
    const contentForStorage = cleanedContent.length > 5000 
      ? cleanedContent.substring(0, 5000) + '...' 
      : cleanedContent;
    
    return {
      title: result.title || title,
      source,
      content: contentForStorage, // Store a properly formatted version of the content
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
    const { topic } = request;
    
    try {
      // Try to fetch real articles from NewsAPI from all available sources
      const sourceArticles = await fetchArticlesFromSources(request);
      
      // Check if we have any articles to analyze
      const totalArticles = Object.values(sourceArticles).reduce(
        (sum, articles) => sum + articles.length, 0
      );
      
      if (totalArticles > 0) {
        // Prepare content for OpenAI analysis
        const analysisPrompt = `
        I need you to find and compare coverage of the EXACT SAME news event across different sources. This is critical - only compare sources covering the identical story.

        I'll provide headlines and excerpts from various news sources on the topic "${topic}".
        
        Your task:
        1. FIRST, carefully examine all headlines and excerpts to identify which sources are covering the EXACT SAME specific news event
        2. EXCLUDE any sources covering different events or aspects of ${topic}
        3. For sources covering the identical story, determine:
           - A bias score (0-100), where 50 is completely neutral, below 50 leans conservative, above 50 leans liberal
           - A brief explanation of how bias manifests in their coverage
        
        Here are the articles from each source:
        ${Object.entries(sourceArticles).map(([source, articles]) => {
          if (!articles.length) return `${source}: No articles found`;
          
          const article = articles[0];
          // Get a clean description and content excerpt
          const description = article.description || "";
          const content = article.content || "";
          // Combine and limit to a reasonable length for analysis
          const excerpt = (description + " " + content).slice(0, 800);
          
          return `
          ${source}:
          Headline: ${article.title}
          Published: ${article.publishedAt || "Unknown date"}
          Content: ${excerpt}...
          `;
        }).join('\n\n')}
        
        FORMAT RULES:
        1. Return a JSON object with an array called "results"
        2. Include ONLY sources covering the EXACT SAME news story
        3. Each result object should have:
           - source: string (news source name)
           - headline: string (the headline)
           - biasScore: number (0-100, with 50 being neutral)
           - politicalLeaning: string (one of "Conservative", "Liberal", "Moderate Conservative", "Moderate Liberal", or "Centrist")
           - explanation: string (one-sentence explanation of the bias)
        
        IMPORTANT: I need at least 3 sources covering the same story. If you can't find 3+ sources covering the identical story, identify a different story within these articles that is covered by at least 3 sources.
        
        Focus on finding the HIGHEST number of sources covering the SAME story.
        `;

        // Call OpenAI to analyze the real articles
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: analysisPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 3000
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        
        // Parse the result - ensuring it has the expected structure
        if (Array.isArray(result)) {
          return result as SourceComparisonResult[];
        } else if (result.results && Array.isArray(result.results)) {
          return result.results as SourceComparisonResult[];
        }
      }
    } catch (error) {
      // Log the error but continue with fallback
      console.error("Error fetching or analyzing real news articles:", error);
    }
    
    // Fallback: Generate synthetic comparison due to rate limits
    console.log("Using fallback for comparison feature due to API rate limits or no matching articles");
    
    // Use OpenAI to provide a better user experience when NewsAPI is rate limited
    const fallbackPrompt = `
    I need you to demonstrate how different news sources might cover the topic "${topic}" differently.
    
    For these major news sources:
    - CNN
    - Fox News
    - New York Times
    - Wall Street Journal
    - BBC
    
    Generate a realistic analysis with:
    1. A plausible headline each source might use for this topic
    2. A bias score (0-100), where 50 is neutral, <50 is conservative-leaning, >50 is liberal-leaning
    3. A brief explanation of how bias might manifest in their coverage
    
    The analysis should be realistic and based on the typical editorial stance of each source.
    
    FORMAT:
    Return a JSON object with an array called "results", each containing:
    - source: string (news source name)
    - headline: string (plausible headline)
    - biasScore: number (0-100)
    - politicalLeaning: string (Conservative/Liberal/Centrist)
    - explanation: string
    `;
    
    const fallbackResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: fallbackPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const fallbackResult = JSON.parse(fallbackResponse.choices[0].message.content || "{}");
    
    // Parse the result - ensuring it has the expected structure
    if (Array.isArray(fallbackResult)) {
      return fallbackResult.map((item: SourceComparisonResult) => ({
        ...item,
        explanation: item.explanation + " (Note: This is an example analysis due to NewsAPI rate limits.)"
      }));
    } else if (fallbackResult.results && Array.isArray(fallbackResult.results)) {
      return fallbackResult.results.map((item: SourceComparisonResult) => ({
        ...item,
        explanation: item.explanation + " (Note: This is an example analysis due to NewsAPI rate limits.)"
      }));
    }
    
    throw new Error("Failed to generate comparison analysis");
  } catch (error) {
    console.error("Error comparing sources:", error);
    throw new Error(`Failed to compare sources: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
