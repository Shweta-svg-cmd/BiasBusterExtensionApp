import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BiasScale from "@/components/ui/bias-scale";
import { Article, SourceComparisonResult } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ComparisonTab() {
  const [sources] = useState({
    nyt: true,
    wsj: true,
    fox: true,
    cnn: true,
    npr: true,
  });
  const [results, setResults] = useState<SourceComparisonResult[] | null>(null);
  const { toast } = useToast();
  
  // Get the latest analyzed article to use its topic for comparison
  const { data: latestAnalysis } = useQuery<Article>({
    queryKey: ["/api/articles/latest"],
    staleTime: 0,
  });

  const compareSourcesMutation = useMutation({
    mutationFn: async (data: { topic: string, sources: string[] }) => {
      const response = await apiRequest("POST", "/api/compare", data);
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      toast({
        title: "Comparison failed",
        description: error instanceof Error ? error.message : "Failed to compare sources",
        variant: "destructive",
      });
    }
  });

  // Auto-compare when a latest analysis is available
  useEffect(() => {
    if (latestAnalysis && latestAnalysis.topics?.main && !compareSourcesMutation.isPending && !results) {
      const selectedSources = Object.keys(sources).filter(source => sources[source as keyof typeof sources]);
      
      // Auto-compare using the main topic of the latest article
      compareSourcesMutation.mutate({
        topic: latestAnalysis.topics.main,
        sources: selectedSources
      });
    }
  }, [latestAnalysis]);

  const handleCompareAgain = () => {
    if (latestAnalysis?.topics?.main) {
      const selectedSources = Object.keys(sources).filter(source => sources[source as keyof typeof sources]);
      
      compareSourcesMutation.mutate({
        topic: latestAnalysis.topics.main,
        sources: selectedSources
      });
    } else {
      toast({
        title: "No topic available",
        description: "Please analyze an article first to get a topic for comparison.",
        variant: "destructive",
      });
    }
  };

  const getBiasColor = (score: number) => {
    if (score < 35) return "bg-blue-500"; // Conservative
    if (score < 45) return "bg-blue-400"; // Somewhat Conservative
    if (score >= 45 && score <= 55) return "bg-green-500"; // Neutral
    if (score < 65) return "bg-red-400"; // Somewhat liberal
    return "bg-red-500"; // Liberal
  };

  const getBiasText = (score: number) => {
    if (score < 35) return "Conservative";
    if (score < 45) return "Leaning Conservative";
    if (score >= 45 && score <= 55) return "Neutral/Centrist";
    if (score < 65) return "Leaning Liberal";
    return "Liberal";
  };

  const getBiasTextColor = (score: number) => {
    if (score < 35) return "text-blue-500"; // Conservative
    if (score < 45) return "text-blue-400"; // Somewhat Conservative
    if (score >= 45 && score <= 55) return "text-green-500"; // Neutral
    if (score < 65) return "text-red-400"; // Somewhat liberal
    return "text-red-500"; // Liberal
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Media Bias Comparison</h2>
          
          {!latestAnalysis ? (
            <div className="bg-gray-800 p-6 rounded-lg text-center">
              <p className="text-gray-300 mb-4">No article has been analyzed yet.</p>
              <p className="text-gray-400 text-sm">Analyze an article first to see how different news sources would cover the same topic.</p>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-md font-medium text-gray-300">Currently comparing coverage of:</h3>
                  <p className="text-xl font-bold text-blue-400 mt-1">
                    {latestAnalysis.topics?.main || "General Topic"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Based on your analysis of "{latestAnalysis.title}"
                  </p>
                </div>
                <Button 
                  className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700"
                  onClick={handleCompareAgain}
                  disabled={compareSourcesMutation.isPending}
                >
                  {compareSourcesMutation.isPending ? "Comparing..." : "Refresh Comparison"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {compareSourcesMutation.isPending && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-300">Analyzing how different media outlets would cover this topic...</p>
              <p className="mt-2 text-sm text-gray-400">This may take a moment as we compare multiple sources.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6 text-white">Media Coverage Comparison: "{latestAnalysis?.topics?.main}"</h2>
            
            {/* Overview bar chart comparing bias scores */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-white">Bias Comparison</h3>
              <div className="bg-black p-6 rounded-lg">
                <div className="space-y-6">
                  {results.map((result, index) => (
                    <div key={index} className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <div className="w-28 text-sm font-medium text-gray-300">{result.source}</div>
                        <div className="flex-1 ml-2">
                          <div className="h-7 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getBiasColor(result.biasScore)}`}
                              style={{ width: `${result.biasScore}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-300 w-32 text-right">
                          <span className={getBiasTextColor(result.biasScore)}>
                            {getBiasText(result.biasScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="min-w-full divide-y divide-gray-800 bg-black rounded-lg overflow-hidden">
                <thead className="bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Headline</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Bias Score</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Key Narrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-black' : 'bg-gray-900/30'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-900 flex items-center justify-center text-gray-300">
                            {result.source.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-300">{result.source}</div>
                            {result.politicalLeaning && (
                              <div className="text-xs text-gray-400">{result.politicalLeaning}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300">{result.headline}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <BiasScale score={result.biasScore} mini maxScore={100} />
                        </div>
                        <span className={`text-xs ${getBiasTextColor(result.biasScore)}`}>
                          {getBiasText(result.biasScore)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {result.keyNarrative}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4 text-white">Side-by-Side Content Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((source, index) => (
                  <div key={index} className="bg-black border border-gray-800 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <div className="h-8 w-8 rounded-full bg-blue-900 flex items-center justify-center text-gray-300 text-xs">
                        {source.source.substring(0, 2).toUpperCase()}
                      </div>
                      <h4 className="font-medium text-sm ml-2 text-gray-200">{source.source}</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      {source.contentAnalysis.map((content, i) => (
                        <p key={i} className="text-gray-300" 
                          dangerouslySetInnerHTML={{ 
                            __html: content
                              .replace(/<span class="bg-blue-100">(.*?)<\/span>/g, '<span class="bg-blue-900/30 text-blue-300 px-1 rounded">$1</span>')
                              .replace(/<span class="bg-red-100">(.*?)<\/span>/g, '<span class="bg-red-900/30 text-red-300 px-1 rounded">$1</span>')
                              .replace(/<span class="bg-green-100">(.*?)<\/span>/g, '<span class="bg-green-900/30 text-emerald-300 px-1 rounded">$1</span>')
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
