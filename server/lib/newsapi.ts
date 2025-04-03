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
  const apiUrl = `https://newsapi.org/v2/everything?q=${encodedTopic}&sources=${sourceId}&sortBy=relevancy&pageSize=5&apiKey=${NEWSAPI_KEY}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NewsAPI error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json() as NewsAPIResponse;
    
    if (data.status !== "ok") {
      throw new Error(`NewsAPI returned non-ok status: ${data.status}`);
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