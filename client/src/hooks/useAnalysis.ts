import { useState } from "react";
import { ArticleAnalysisRequest } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAnalysis() {
  const queryClient = useQueryClient();
  
  const analyzeArticleMutation = useMutation({
    mutationFn: async (request: ArticleAnalysisRequest) => {
      const response = await apiRequest("POST", "/api/analyze", request);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both the latest analysis and recent articles queries
      queryClient.invalidateQueries({ queryKey: ["/api/articles/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/count"] });
    },
  });

  return {
    analyzeArticle: analyzeArticleMutation.mutateAsync,
    isAnalyzing: analyzeArticleMutation.isPending,
    error: analyzeArticleMutation.error,
  };
}
