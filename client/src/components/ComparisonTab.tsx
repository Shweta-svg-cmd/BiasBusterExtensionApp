import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import BiasScale from "@/components/ui/bias-scale";
import { BiasBarChart } from "@/components/ui/barchart";
import { SpiderChart, SpiderChartDataPoint } from "@/components/ui/spider-chart";
import { BiasRadarChart, BiasRadarData } from "@/components/ui/radar-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Article, SourceComparisonResult } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Define source colors for consistent display across charts
const SOURCE_COLORS: Record<string, string> = {
  "New York Times": "#8b5cf6", // violet-500
  "Wall Street Journal": "#3b82f6", // blue-500
  "Fox News": "#ef4444", // red-500
  "CNN": "#ec4899", // pink-500
  "BBC": "#6366f1", // indigo-500
  "Washington Post": "#f97316", // orange-500
  "NPR": "#10b981", // emerald-500
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
  
  // Prepare data for spider chart visualization
  const prepareSpiderChartData = (): SpiderChartDataPoint[] => {
    if (!results) return [];
    
    return results.map(result => ({
      source: result.source,
      biasScore: result.biasScore,
      emotionalTone: result.emotionalTone || 50,
      factualFocus: result.factualFocus || 50,
      framingScore: result.framingScore || 50,
      color: getSourceColor(result.source),
    }));
  };
  
  // Prepare data for radar chart
  const prepareRadarData = (sourceIndex: number): BiasRadarData[] => {
    if (!results || !results[sourceIndex]) return [];
    
    const result = results[sourceIndex];
    return [
      { name: 'Bias', value: result.biasScore, fullMark: 100 },
      { name: 'Emotion', value: result.emotionalTone || 50, fullMark: 100 },
      { name: 'Facts', value: result.factualFocus || 50, fullMark: 100 },
      { name: 'Framing', value: result.framingScore || 50, fullMark: 100 },
    ];
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-semibold text-white bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
            Media Bias Comparison
          </CardTitle>
          <CardDescription className="text-slate-300">
            Compare how different media outlets cover the same topic with bias analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!latestAnalysis ? (
            <div className="bg-slate-800 p-6 rounded-lg text-center">
              <p className="text-slate-300 mb-4">No article has been analyzed yet.</p>
              <p className="text-slate-400 text-sm">Analyze an article first to see how different news sources would cover the same topic.</p>
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
              <p className="mt-4 text-slate-300">Analyzing media coverage across multiple sources...</p>
              <p className="mt-2 text-sm text-slate-400">This may take a moment as we compare coverage from different outlets.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card className="bg-slate-900 border-slate-800 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-white">
              Media Coverage: "{latestAnalysis?.topics?.main}"
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="visual">Visual Comparison</TabsTrigger>
                <TabsTrigger value="sources">Source Details</TabsTrigger>
                <TabsTrigger value="content">Content Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visual" className="space-y-6">
                {/* Bias Score Comparison */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      Bias Score Comparison
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      How politically biased is each source's coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <BiasBarChart 
                        data={prepareBarChartData()} 
                        horizontal={true}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Multi-dimensional Analysis */}
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                      Multidimensional Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Compare sources across multiple dimensions of bias
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <SpiderChart 
                        data={prepareSpiderChartData()}
                        height={400}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sources" className="space-y-6">
                {/* Source Details Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-700 bg-slate-800/50 rounded-lg overflow-hidden">
                    <thead className="bg-slate-800">
                      <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Source</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Headline</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Bias Score</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Key Narrative</th>
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
                            <span className={`text-xs ${getBiasTextColor(result.biasScore)}`}>
                              {getBiasText(result.biasScore)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            {result.keyNarrative}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Individual Source Radar Charts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {results.map((result, index) => (
                    <Card key={index} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-200 mr-3"
                            style={{ backgroundColor: getSourceColor(result.source) + '33' }}>
                            {result.source.substring(0, 2).toUpperCase()}
                          </div>
                          <CardTitle className="text-md font-medium text-slate-200">
                            {result.source}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[230px]">
                          <BiasRadarChart data={prepareRadarData(index)} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-6">
                {/* Content Analysis Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((source, index) => (
                    <Card key={index} className="bg-slate-800 border-slate-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-slate-200 mr-3"
                            style={{ backgroundColor: getSourceColor(source.source) + '33' }}>
                            {source.source.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-md font-medium text-slate-200">
                              {source.source}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                              {source.politicalLeaning}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 text-sm">
                          {source.contentAnalysis.map((content, i) => (
                            <p key={i} className="text-slate-300" 
                              dangerouslySetInnerHTML={{ 
                                __html: content
                                  .replace(/<span class="bg-blue-100">(.*?)<\/span>/g, '<span class="bg-blue-900/30 text-blue-300 px-1 rounded">$1</span>')
                                  .replace(/<span class="bg-red-100">(.*?)<\/span>/g, '<span class="bg-red-900/30 text-red-300 px-1 rounded">$1</span>')
                                  .replace(/<span class="bg-green-100">(.*?)<\/span>/g, '<span class="bg-green-900/30 text-emerald-300 px-1 rounded">$1</span>')
                              }} 
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
