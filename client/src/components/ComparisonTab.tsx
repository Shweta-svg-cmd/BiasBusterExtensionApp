import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BiasScale from "@/components/ui/bias-scale";
import { BiasBarChart } from "@/components/ui/barchart";
import { Article, SourceComparisonResult } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define source colors for consistent display across charts with an aesthetic palette
const SOURCE_COLORS: Record<string, string> = {
  "New York Times": "#9d4edd", // purple-orchid
  "Wall Street Journal": "#3a86ff", // blue-azure 
  "Fox News": "#ff9e00", // yellow-orange
  "CNN": "#ff52a2", // pink-magenta
  "BBC": "#4361ee", // royal-blue
  "Washington Post": "#f72585", // hot-pink
  "NPR": "#06d6a0", // teal-green
  "ABC News": "#118ab2", // steel-blue
  "CBS News": "#073b4c", // dark-blue
  "Reuters": "#7209b7", // purple-violet
  "Politico": "#8a5a44", // brown-sienna
  "USA Today": "#5390d9", // blue-sky
  "The Hill": "#c77dff", // lavender-purple
  "MSNBC": "#3a0ca3", // indigo-dark
  "The Guardian": "#d62828", // cinnabar-red
};

// Get color for a source (or fallback)
const getSourceColor = (source: string): string => {
  const simplifiedName = Object.keys(SOURCE_COLORS).find(
    name => source.toLowerCase().includes(name.toLowerCase())
  );
  return simplifiedName ? SOURCE_COLORS[simplifiedName] : "#64748b"; // slate-500
};

export default function ComparisonTab() {
  const [results, setResults] = useState<SourceComparisonResult[] | null>(null);
  const { toast } = useToast();
  
  // Get the latest analyzed article to use its topic for comparison
  const { data: latestAnalysis } = useQuery<Article>({
    queryKey: ["/api/articles/latest"],
    staleTime: 0,
  });

  const compareSourcesMutation = useMutation({
    mutationFn: async (topic: string) => {
      const response = await apiRequest("POST", "/api/compare", { topic });
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
    if (latestAnalysis?.topics?.main && !compareSourcesMutation.isPending && !results) {
      // Auto-compare using the main topic of the latest article
      compareSourcesMutation.mutate(latestAnalysis.topics.main);
    }
  }, [latestAnalysis]);

  const handleCompareAgain = () => {
    if (latestAnalysis?.topics?.main) {
      compareSourcesMutation.mutate(latestAnalysis.topics.main);
    } else {
      toast({
        title: "No topic available",
        description: "Please analyze an article first to get a topic for comparison.",
        variant: "destructive",
      });
    }
  };

  const getBiasLabel = (score: number) => {
    if (score < 30) return "Very Conservative";
    if (score < 40) return "Conservative";
    if (score < 45) return "Leaning Conservative";
    if (score >= 45 && score <= 55) return "Neutral/Centrist";
    if (score < 65) return "Leaning Liberal";
    if (score < 75) return "Liberal";
    return "Very Liberal";
  };

  const getBiasLabelColor = (score: number) => {
    if (score < 30) return "text-[#3a0ca3]"; // Very Conservative
    if (score < 40) return "text-[#4361ee]"; // Conservative
    if (score < 45) return "text-[#3a86ff]"; // Leaning Conservative
    if (score >= 45 && score <= 55) return "text-[#06d6a0]"; // Neutral/Centrist
    if (score < 65) return "text-[#f72585]"; // Leaning Liberal
    if (score < 75) return "text-[#7209b7]"; // Liberal
    return "text-[#9d4edd]"; // Very Liberal
  };

  // Prepare data for bar chart visualization
  const prepareBarChartData = () => {
    if (!results) return [];
    
    return results.map(result => ({
      name: result.source,
      value: result.biasScore,
      category: result.politicalLeaning,
      color: getSourceColor(result.source),
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Media Bias Comparison
          </CardTitle>
          <CardDescription className="text-slate-300">
            Compare how different media outlets cover the same news story
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!latestAnalysis ? (
            <div className="bg-slate-800 p-6 rounded-lg text-center">
              <p className="text-slate-300 mb-4">No article has been analyzed yet.</p>
              <p className="text-slate-400 text-sm">Analyze an article first to see how different news sources cover the same story.</p>
            </div>
          ) : (
            <div className="bg-slate-800/70 p-6 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-md font-medium text-slate-300">Currently comparing coverage of:</h3>
                  <p className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-1">
                    {latestAnalysis.topics?.main || "General Topic"}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Based on your analysis of "{latestAnalysis.title}"
                  </p>
                </div>
                <Button 
                  className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white border-0"
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
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <p className="mt-4 text-slate-300">Finding the same news story across multiple sources...</p>
              <p className="mt-2 text-sm text-slate-400">This may take a moment as we compare coverage from different outlets.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-white">
              Bias in Coverage: "{latestAnalysis?.topics?.main}"
            </CardTitle>
            <CardDescription className="text-slate-400">
              Comparing how different media outlets cover the exact same news story
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Bias Score Bar Chart Comparison */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Bias Comparison
                </CardTitle>
                <CardDescription className="text-slate-400">
                  How politically biased is each source's coverage of the same story
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <BiasBarChart 
                    data={prepareBarChartData()} 
                    horizontal={false}
                    domain={[0, 100]}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Source Details Table */}
            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-slate-700 bg-slate-800/50 rounded-lg overflow-hidden">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Headline</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bias Score</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {results.map((result, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-slate-800/50' : 'bg-slate-900/30'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-200"
                            style={{ backgroundColor: getSourceColor(result.source) + '33' }}>
                            {result.source.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-300">{result.source}</div>
                            {result.politicalLeaning && (
                              <div className="text-xs text-slate-400">{result.politicalLeaning}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300">{result.headline}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <BiasScale score={result.biasScore} mini maxScore={100} />
                        </div>
                        <span className={`text-xs ${getBiasLabelColor(result.biasScore)}`}>
                          {getBiasLabel(result.biasScore)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {result.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <h3 className="text-md font-medium text-slate-300 mb-2">About this comparison:</h3>
              <p className="text-sm text-slate-400">
                This analysis compares how different news sources cover the <span className="text-white font-semibold">exact same news story</span>. 
                Only sources covering the same specific event are included, ensuring a fair comparison of bias in reporting.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}