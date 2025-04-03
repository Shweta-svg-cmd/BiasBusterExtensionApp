import { ArticleAnalysisRequest, BiasedPhrase } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export type ArticleAnalysisResponse = {
  title: string;
  source?: string;
  content: string;
  biasScore: number;
  biasAnalysis: string;
  neutralText: string;
  biasedPhrases: BiasedPhrase[];
};

export async function analyzeArticle(request: ArticleAnalysisRequest): Promise<ArticleAnalysisResponse> {
  try {
    const response = await apiRequest("POST", "/api/analyze", request);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to analyze article: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export type ComparisonRequest = {
  topic: string;
  sources: string[];
};

export type ComparisonResponse = {
  results: Array<{
    source: string;
    headline: string;
    biasScore: number;
    keyNarrative: string;
    contentAnalysis: string[];
  }>;
};

export async function compareNewsSources(request: ComparisonRequest): Promise<ComparisonResponse> {
  try {
    const response = await apiRequest("POST", "/api/compare", request);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to compare news sources: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
