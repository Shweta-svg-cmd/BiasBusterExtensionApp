import { SourceComparisonRequest } from "@shared/schema";

const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const NEWS_SOURCES = {
  "New York Times": "the-new-york-times",
  "Wall Street Journal": "the-wall-street-journal",
  "Fox News": "fox-news",
  "CNN": "cnn",
  "BBC": "bbc-news",
  "Washington Post": "the-washington-post",
  "NPR": "npr",
  "Guardian": "the-guardian-uk"
};

export type NewsAPIResponse = {
  status: string;
  totalResults: number;
  articles: NewsAPIArticle[];
};

export type NewsAPIArticle = {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
};

/**
 * Fetches news articles from NewsAPI based on the topic and source
 */
export async function fetchNewsArticles(topic: string, source: string): Promise<NewsAPIArticle[]> {
  if (!NEWSAPI_KEY) {
    throw new Error("NewsAPI key is not configured");
  }
  
  // Map the source name to NewsAPI source ID
  const sourceId = NEWS_SOURCES[source as keyof typeof NEWS_SOURCES] || source;
  
  const encodedTopic = encodeURIComponent(topic);
  
  // First try with sources parameter
  let apiUrl = `https://newsapi.org/v2/everything?q=${encodedTopic}&sources=${sourceId}&sortBy=relevancy&pageSize=5&apiKey=${NEWSAPI_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`NewsAPI error with sources parameter (${response.status}): ${errorText}`);
      
      // If the sources parameter fails, try with domains parameter as fallback
      if (response.status === 400) {
        // Create a domain from the source name (simplified approach)
        const domain = sourceId
          .replace(/^the-/, '')  // Remove leading "the-"
          .replace(/-/g, '.');   // Convert hyphens to dots
        
        apiUrl = `https://newsapi.org/v2/everything?q=${encodedTopic}&domains=${domain}.com&sortBy=relevancy&pageSize=5&apiKey=${NEWSAPI_KEY}`;
        
        const fallbackResponse = await fetch(apiUrl);
        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          throw new Error(`NewsAPI fallback error (${fallbackResponse.status}): ${fallbackErrorText}`);
        }
        
        const fallbackData = await fallbackResponse.json() as NewsAPIResponse;
        if (fallbackData.status !== "ok") {
          throw new Error(`NewsAPI returned non-ok status: ${fallbackData.status}`);
        }
        
        return fallbackData.articles;
      } else {
        throw new Error(`NewsAPI error (${response.status}): ${errorText}`);
      }
    }
    
    const data = await response.json() as NewsAPIResponse;
    
    if (data.status !== "ok") {
      throw new Error(`NewsAPI returned non-ok status: ${data.status}`);
    }
    
    // If we got empty results, try an alternative approach
    if (data.articles.length === 0) {
      // Try with a more general search including the source name
      const encodedSource = encodeURIComponent(source.toLowerCase());
      apiUrl = `https://newsapi.org/v2/everything?q=${encodedTopic}+${encodedSource}&sortBy=relevancy&pageSize=5&apiKey=${NEWSAPI_KEY}`;
      
      const alternativeResponse = await fetch(apiUrl);
      if (!alternativeResponse.ok) {
        return []; // Return original empty result if alternative also fails
      }
      
      const alternativeData = await alternativeResponse.json() as NewsAPIResponse;
      if (alternativeData.status !== "ok" || alternativeData.articles.length === 0) {
        return data.articles; // Return original results if alternative fails or is also empty
      }
      
      // Filter to try to get only articles from the desired source
      const filtered = alternativeData.articles.filter(article => 
        article.source.name.toLowerCase().includes(source.toLowerCase())
      );
      
      return filtered.length > 0 ? filtered : alternativeData.articles.slice(0, 2);
    }
    
    return data.articles;
  } catch (error) {
    console.error("Error fetching from NewsAPI:", error);
    throw new Error(`Failed to fetch articles from ${source}: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Fetches articles from multiple sources on the same topic
 */
export async function fetchArticlesFromSources(request: SourceComparisonRequest): Promise<Record<string, NewsAPIArticle[]>> {
  const { topic, sources } = request;
  const result: Record<string, NewsAPIArticle[]> = {};
  
  // Use Promise.allSettled to fetch from all sources even if some fail
  const promises = sources.map(async (source) => {
    try {
      const articles = await fetchNewsArticles(topic, source);
      result[source] = articles;
    } catch (error) {
      console.error(`Error fetching from ${source}:`, error);
      result[source] = []; // Empty array for failed sources
    }
  });
  
  await Promise.allSettled(promises);
  return result;
}