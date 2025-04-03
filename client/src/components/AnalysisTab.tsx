import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAnalysis } from "@/hooks/useAnalysis";
import BiasScale from "@/components/ui/bias-scale";
import { Article } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

export default function AnalysisTab() {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { analyzeArticle } = useAnalysis();

  const { data: recentArticles } = useQuery<Article[]>({
    queryKey: ["/api/articles/recent"],
    staleTime: 60000,
  });

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
    if (score <= -5) return "Conservative Leaning";
    if (score < 0) return "Slightly Conservative";
    if (score === 0) return "Neutral";
    if (score < 5) return "Slightly Liberal";
    return "Liberal Leaning";
  };

  const getBiasLabelColor = (score: number) => {
    if (score < 0) return "text-status-error";
    if (score === 0) return "text-status-warning";
    return "text-status-success";
  };

  const getBiasPosition = (score: number) => {
    // Convert score (-10 to 10) to percentage (0% to 100%)
    return (score + 10) * 5;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Section */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Analyze News Article</h2>
            <form className="space-y-4" onSubmit={handleAnalyze}>
              <div>
                <label htmlFor="article-url" className="block text-sm font-medium text-neutral-medium">
                  Article URL
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <Input
                    type="url"
                    id="article-url"
                    placeholder="https://example.com/news-article"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" className="ml-3" disabled={isAnalyzing}>
                    Analyze
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-sm text-neutral-medium">OR</span>
                </div>
              </div>

              <div>
                <label htmlFor="article-text" className="block text-sm font-medium text-neutral-medium">
                  Paste Article Text
                </label>
                <Textarea
                  id="article-text"
                  rows={8}
                  placeholder="Paste the full text of the news article here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  disabled={isAnalyzing}
                >
                  Clear
                </Button>
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze Text"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm text-neutral-medium">Analyzing article for bias...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {latestAnalysis && !isAnalyzing && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
              
              {/* Article Info */}
              <div className="mb-6">
                <h3 className="font-medium text-lg text-neutral-dark">{latestAnalysis.title}</h3>
                <p className="text-sm text-neutral-medium">
                  {latestAnalysis.source && (
                    <>Source: <span className="font-medium">{latestAnalysis.source}</span> • </>
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
                <h4 className="text-sm font-medium text-neutral-medium mb-2">Overall Bias Score</h4>
                <BiasScale 
                  score={latestAnalysis.biasScore} 
                  maxScore={100} // Using new 0-100 scale
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-800 rounded-md p-3 text-center">
                    <div className="text-sm text-gray-400">Political Leaning</div>
                    <div className="text-lg font-medium text-white mt-1">
                      {latestAnalysis.politicalLeaning || "Centrist"}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-md p-3 text-center">
                    <div className="text-sm text-gray-400">Emotional Language</div>
                    <div className="text-lg font-medium text-white mt-1">
                      {latestAnalysis.emotionalLanguage || "Moderate"}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-md p-3 text-center">
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
                        <path d="M3 3v18h18"></path>
                        <path d="M18 17V9"></path>
                        <path d="M13 17V5"></path>
                        <path d="M8 17v-3"></path>
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-white">Multidimensional Bias Analysis</h4>
                  </div>
                  <div className="bg-black p-4 rounded-lg">
                    <div className="h-64 w-full relative flex items-center justify-center">
                      {/* Pentagon shape with 5 points */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Background pentagon grid layers */}
                        <div className="pentagon-grid h-full w-full opacity-20 border border-gray-600"></div>
                        <div className="pentagon-grid h-[80%] w-[80%] opacity-30 border border-gray-600 absolute"></div>
                        <div className="pentagon-grid h-[60%] w-[60%] opacity-40 border border-gray-600 absolute"></div>
                        <div className="pentagon-grid h-[40%] w-[40%] opacity-50 border border-gray-600 absolute"></div>
                        <div className="pentagon-grid h-[20%] w-[20%] opacity-60 border border-gray-600 absolute"></div>
                      </div>
                      
                      {/* Data polygon (green shape) */}
                      <div className="data-polygon absolute h-full w-full" style={{
                        clipPath: `polygon(
                          50% ${25}%, 
                          ${85}% ${35}%, 
                          ${75}% ${75}%, 
                          ${25}% ${75}%, 
                          ${15}% ${35}%
                        )`
                      }}>
                        <div className="h-full w-full bg-teal-600/40"></div>
                      </div>
                      
                      {/* Axes Labels */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-xs text-gray-400">Bias</div>
                      <div className="absolute right-[15%] top-[35%] text-xs text-gray-400">Emotional</div>
                      <div className="absolute right-[25%] bottom-[25%] text-xs text-gray-400">Factual</div>
                      <div className="absolute left-[25%] bottom-[25%] text-xs text-gray-400">Political</div>
                      <div className="absolute left-[15%] top-[35%] text-xs text-gray-400">Neutral Language</div>
                      
                      {/* Values at key points (optional) */}
                      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 text-xs text-white">75%</div>
                      <div className="absolute right-[8%] top-[35%] text-xs text-white">65%</div>
                      <div className="absolute right-[25%] bottom-[15%] text-xs text-white">50%</div>
                      <div className="absolute left-[25%] bottom-[15%] text-xs text-white">70%</div>
                      <div className="absolute left-[8%] top-[35%] text-xs text-white">80%</div>
                    </div>
                  </div>
                  
                  <style dangerouslySetInnerHTML={{
                    __html: `
                    .pentagon-grid {
                      clip-path: polygon(
                        50% 0%, 
                        100% 38%, 
                        82% 100%, 
                        18% 100%, 
                        0% 38%
                      );
                    }
                    
                    .data-polygon {
                      background: linear-gradient(135deg, rgba(0, 128, 128, 0.3), rgba(0, 255, 171, 0.6));
                    }
                  `}} />
                </div>
              )}

              {/* Article Topics */}
              {latestAnalysis.topics && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-neutral-medium mb-2">Article Topics</h4>
                  <div className="bg-slate-800 p-4 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-400">Main topic:</span>
                      <div className="inline-block ml-2 bg-indigo-600 text-white rounded-full px-3 py-1 text-sm font-semibold">
                        {latestAnalysis.topics.main || "General"}
                      </div>
                    </div>
                    
                    {latestAnalysis.topics.related && latestAnalysis.topics.related.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-400">Related topics:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {latestAnalysis.topics.related.map((topic, index) => (
                            <div key={index} className="bg-slate-700 text-white rounded-full px-3 py-1 text-xs">
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
                <h4 className="text-sm font-medium text-neutral-medium mb-2">Key Findings</h4>
                <div className="bg-slate-800 p-4 rounded-lg">
                  <p className="text-sm text-gray-300">{latestAnalysis.biasAnalysis}</p>
                </div>
              </div>

              {/* Identified Biased Phrases */}
              {latestAnalysis.biasedPhrases && latestAnalysis.biasedPhrases.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-neutral-medium mb-2">Identified Biased Phrases</h4>
                  <ul className="space-y-2">
                    {latestAnalysis.biasedPhrases.map((phrase, index) => (
                      <li key={index} className="text-sm bg-red-50 p-3 rounded border-l-4 border-status-error">
                        <p className="text-neutral-dark">{phrase.text}</p>
                        <p className="text-xs text-neutral-medium mt-1">{phrase.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Neutral Alternative */}
              {latestAnalysis.neutralText && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-neutral-medium">Neutral Alternative</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary flex items-center"
                      onClick={() => handleCopyNeutral(latestAnalysis.neutralText)}
                    >
                      <span className="mr-1">📋</span> Copy
                    </Button>
                  </div>
                  <div className="bg-neutral-bg p-3 rounded text-sm text-neutral-dark">
                    {latestAnalysis.neutralText}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Side Panel */}
      <div className="space-y-6">
        {/* Recently Analyzed */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recently Analyzed</h2>
            <div className="space-y-4">
              {recentArticles && recentArticles.length > 0 ? (
                recentArticles.map((article: Article) => (
                  <div key={article.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                    <h3 className="text-sm font-medium hover:text-primary cursor-pointer">
                      {article.title}
                    </h3>
                    <div className="flex items-center mt-2 text-xs text-neutral-medium">
                      <span>{article.source}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(article.analyzedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 relative">
                      <BiasScale score={article.biasScore} mini />
                    </div>
                    <div className="text-xs text-right mt-1">
                      <span className={getBiasLabelColor(article.biasScore)}>
                        {getBiasLabel(article.biasScore)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-medium">No articles analyzed yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Tips */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Tips for Using BiasDetector</h2>
            <ul className="space-y-3 text-sm text-neutral-dark">
              <li className="flex">
                <span className="text-primary mr-2 flex-shrink-0">💡</span>
                <span>Paste full articles for the most accurate analysis</span>
              </li>
              <li className="flex">
                <span className="text-primary mr-2 flex-shrink-0">💡</span>
                <span>Compare multiple sources on the same topic to identify different biases</span>
              </li>
              <li className="flex">
                <span className="text-primary mr-2 flex-shrink-0">💡</span>
                <span>Install our Chrome extension to analyze articles as you browse</span>
              </li>
              <li className="flex">
                <span className="text-primary mr-2 flex-shrink-0">💡</span>
                <span>Use the neutral alternative text to understand a balanced perspective</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Download Extension */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chrome Extension</h2>
            <span>🧩</span>
          </div>
          <p className="text-sm mb-4">Analyze news articles directly while browsing with our Chrome extension.</p>
          <Button className="w-full bg-white text-primary hover:bg-opacity-90 transition-all">
            Add to Chrome
          </Button>
        </div>
      </div>
    </div>
  );
}
