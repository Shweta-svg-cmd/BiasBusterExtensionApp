import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAnalysis } from "@/hooks/useAnalysis";
import BiasScale from "@/components/ui/bias-scale";
import { BiasBarChart } from "@/components/ui/barchart";
import { Article } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function AnalysisTab() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { analyzeArticle } = useAnalysis();

  // Removed recent articles query as per requirement

  const handleClear = () => {
    setUrl("");
    setText("");
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url && !text) {
      toast({
        title: "Input required",
        description: "Please enter a URL or paste article text to analyze.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      await analyzeArticle({ url, text });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyNeutral = (neutralText: string | null) => {
    if (!neutralText) return;
    
    navigator.clipboard.writeText(neutralText);
    toast({
      title: "Copied to clipboard",
      description: "The neutral text has been copied to your clipboard.",
    });
  };

  const { data: latestAnalysis } = useQuery<Article>({
    queryKey: ["/api/articles/latest"],
    staleTime: 0, // Always fetch fresh data
  });

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

  const getBiasPosition = (score: number) => {
    // Convert score (-10 to 10) to percentage (0% to 100%)
    return (score + 10) * 5;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Analyze News Article</h2>
            <form className="space-y-4" onSubmit={handleAnalyze}>
              <div>
                <label htmlFor="article-url" className="block text-sm font-medium text-gray-300">
                  Article URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <Input
                    type="url"
                    id="article-url"
                    placeholder="https://example.com/news-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-blue-600 focus:ring-blue-600"
                  />
                  <Button 
                    type="submit" 
                    className="ml-3 bg-blue-700 hover:bg-blue-600" 
                    disabled={isAnalyzing}
                  >
                    Analyze
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-gray-900 text-sm text-gray-400">OR</span>
                </div>
              </div>

              <div>
                <label htmlFor="article-text" className="block text-sm font-medium text-gray-300">
                  Paste Article Text
                </label>
                <Textarea
                  id="article-text"
                  rows={8}
                  placeholder="Paste the full text of the news article here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1 bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isAnalyzing}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Clear
                </Button>
                <Button 
                  type="submit" 
                  disabled={isAnalyzing}
                  className="bg-blue-700 hover:bg-blue-600"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Text"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-sm text-gray-400">Analyzing article for bias...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {latestAnalysis && !isAnalyzing && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">Analysis Results</h2>
              
              {/* Article Info */}
              <div className="mb-6">
                <h3 className="font-medium text-lg text-white">{latestAnalysis.title}</h3>
                <p className="text-sm text-gray-400">
                  {latestAnalysis.source && (
                    <>Source: <span className="font-medium text-gray-300">{latestAnalysis.source}</span> • </>
                  )}
                  <span>{new Date(latestAnalysis.analyzedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </p>
              </div>

              {/* Bias Score */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Overall Bias Score</h4>
                <BiasScale 
                  score={latestAnalysis.biasScore} 
                  maxScore={100} // Using new 0-100 scale
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-800 rounded-md p-3 text-center border border-gray-700">
                    <div className="text-sm text-gray-400">Political Leaning</div>
                    <div className="text-lg font-medium text-white mt-1">
                      {latestAnalysis.politicalLeaning || "Centrist"}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-md p-3 text-center border border-gray-700">
                    <div className="text-sm text-gray-400">Emotional Language</div>
                    <div className="text-lg font-medium text-white mt-1">
                      {latestAnalysis.emotionalLanguage || "Moderate"}
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-md p-3 text-center border border-gray-700">
                    <div className="text-sm text-gray-400">Factual Reporting</div>
                    <div className="text-lg font-medium text-white mt-1">
                      {latestAnalysis.factualReporting || "Moderate"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Multidimensional Analysis */}
              {latestAnalysis.multidimensionalAnalysis && (
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 mr-2 text-blue-400 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-white">Multidimensional Bias Analysis</h4>
                  </div>
                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <BiasBarChart 
                      data={[
                        { 
                          name: 'Bias', 
                          value: latestAnalysis.multidimensionalAnalysis.bias || 50,
                          explanation: "Measures political leaning and overall bias in the article"
                        },
                        { 
                          name: 'Emotional', 
                          value: latestAnalysis.multidimensionalAnalysis.emotional || 50,
                          explanation: "Measures use of emotional language"
                        },
                        { 
                          name: 'Factual', 
                          value: latestAnalysis.multidimensionalAnalysis.factual || 50,
                          explanation: "Measures factual reporting and objectivity"
                        },
                        { 
                          name: 'Political', 
                          value: latestAnalysis.multidimensionalAnalysis.political || 50,
                          explanation: "Measures political content and framing"
                        },
                        { 
                          name: 'Neutral', 
                          value: latestAnalysis.multidimensionalAnalysis.neutralLanguage || 50,
                          explanation: "Measures neutral language and presentation"
                        },
                      ]}
                      domain={[0, 100]}
                      horizontal={true}
                      height={300}
                    />
                    
                    <div className="grid grid-cols-5 gap-2 mt-4 text-center text-xs">
                      <div className="text-blue-400">
                        <div className="font-bold">Bias</div>
                        <div className="text-gray-300">{latestAnalysis.multidimensionalAnalysis.bias}%</div>
                      </div>
                      <div className="text-blue-400">
                        <div className="font-bold">Emotional</div>
                        <div className="text-gray-300">{latestAnalysis.multidimensionalAnalysis.emotional}%</div>
                      </div>
                      <div className="text-blue-400">
                        <div className="font-bold">Factual</div>
                        <div className="text-gray-300">{latestAnalysis.multidimensionalAnalysis.factual}%</div>
                      </div>
                      <div className="text-blue-400">
                        <div className="font-bold">Political</div>
                        <div className="text-gray-300">{latestAnalysis.multidimensionalAnalysis.political}%</div>
                      </div>
                      <div className="text-blue-400">
                        <div className="font-bold">Neutral</div>
                        <div className="text-gray-300">{latestAnalysis.multidimensionalAnalysis.neutralLanguage}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Article Topics */}
              {latestAnalysis.topics && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Article Topics</h4>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div>
                      <span className="text-xs text-gray-400">Main topic:</span>
                      <div className="inline-block ml-2 bg-blue-900 text-white rounded-full px-3 py-1 text-sm font-semibold">
                        {latestAnalysis.topics.main || "General"}
                      </div>
                    </div>
                    
                    {latestAnalysis.topics.related && latestAnalysis.topics.related.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-400">Related topics:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {latestAnalysis.topics.related.map((topic, index) => (
                            <div key={index} className="bg-gray-700 text-white rounded-full px-3 py-1 text-xs">
                              {topic}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key Findings */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Key Findings</h4>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  {latestAnalysis.biasAnalysis ? 
                    latestAnalysis.biasAnalysis.split(". ").filter(Boolean).map((finding: string, index: number) => (
                      <div key={index} className="flex mb-2 last:mb-0">
                        <div className="text-blue-400 mr-2 font-bold">•</div>
                        <p className="text-sm text-gray-300">{finding.trim() + (finding.endsWith(".") ? "" : ".")}</p>
                      </div>
                    ))
                    : 
                    <p className="text-sm text-gray-300">No analysis available</p>
                  }
                </div>
              </div>

              {/* Side by Side Comparison */}
              {latestAnalysis.content && latestAnalysis.neutralText && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Original vs. Neutral Content</h4>
                  <div className="bg-gray-800 rounded-lg border border-gray-700">
                    <Tabs defaultValue="compare" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 bg-gray-900">
                        <TabsTrigger value="compare" className="text-gray-300 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                          Side by Side
                        </TabsTrigger>
                        <TabsTrigger value="neutral" className="text-gray-300 data-[state=active]:bg-blue-900 data-[state=active]:text-white">
                          Neutral Only
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="compare" className="p-0 m-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                          <div>
                            <div className="text-sm text-gray-400 font-bold mb-2 flex items-center">
                              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                              Original Article
                            </div>
                            <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 h-[300px] overflow-y-auto border border-gray-700">
                              {latestAnalysis.content}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-400 font-bold mb-2 flex items-center">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              Neutral Version
                            </div>
                            <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 h-[300px] overflow-y-auto border border-gray-700">
                              {latestAnalysis.neutralText}
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="neutral" className="p-0 m-0">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-gray-400 font-bold flex items-center">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              Neutral Alternative
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs text-blue-400 border-gray-700 hover:bg-gray-800"
                              onClick={() => handleCopyNeutral(latestAnalysis.neutralText)}
                            >
                              <span className="mr-1">📋</span> Copy Text
                            </Button>
                          </div>
                          <div className="bg-gray-900 p-3 rounded text-sm text-gray-300 h-[300px] overflow-y-auto border border-gray-700">
                            {latestAnalysis.neutralText}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        {/* Usage Tips */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4 text-white">Tips for Using BiasDetector</h2>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex">
                <span className="text-blue-400 mr-2 flex-shrink-0">💡</span>
                <span>Paste full articles for the most accurate analysis</span>
              </li>
              <li className="flex">
                <span className="text-blue-400 mr-2 flex-shrink-0">💡</span>
                <span>Compare multiple sources on the same topic to identify different biases</span>
              </li>
              <li className="flex">
                <span className="text-blue-400 mr-2 flex-shrink-0">💡</span>
                <span>Install our Chrome extension to analyze articles as you browse</span>
              </li>
              <li className="flex">
                <span className="text-blue-400 mr-2 flex-shrink-0">💡</span>
                <span>Use the neutral alternative text to understand a balanced perspective</span>
              </li>
            </ul>
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
