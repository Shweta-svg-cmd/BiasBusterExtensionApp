import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import BiasScale from "@/components/ui/bias-scale";
import { SourceComparisonResult } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ComparisonTab() {
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState({
    nyt: true,
    wsj: true,
    fox: true,
    cnn: false,
    npr: false,
  });
  const [results, setResults] = useState<SourceComparisonResult[] | null>(null);
  const { toast } = useToast();

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

  const handleSourceChange = (source: keyof typeof sources) => {
    setSources((prev) => ({
      ...prev,
      [source]: !prev[source],
    }));
  };

  const handleCompare = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic) {
      toast({
        title: "Topic required",
        description: "Please enter a news topic to compare.",
        variant: "destructive",
      });
      return;
    }

    const selectedSources = Object.keys(sources).filter(source => sources[source as keyof typeof sources]);
    
    if (selectedSources.length === 0) {
      toast({
        title: "Sources required",
        description: "Please select at least one news source.",
        variant: "destructive",
      });
      return;
    }

    compareSourcesMutation.mutate({
      topic,
      sources: selectedSources
    });
  };

  const getBiasPosition = (score: number) => {
    // Convert score (-10 to 10) to percentage (0% to 100%)
    return (score + 10) * 5;
  };

  const getBiasColor = (score: number) => {
    if (score < 0) return "bg-status-error";
    if (score === 0) return "bg-status-warning";
    return "bg-status-success";
  };

  const getBiasText = (score: number) => {
    if (score <= -5) return "Conservative";
    if (score < 0) return "Conservative";
    if (score === 0) return "Neutral";
    if (score < 5) return "Liberal";
    return "Liberal";
  };

  const getBiasTextColor = (score: number) => {
    if (score < 0) return "text-status-error";
    if (score === 0) return "text-status-warning";
    return "text-status-success";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Compare News Sources</h2>
          <p className="text-sm text-neutral-medium mb-4">Enter a topic or event to compare how different news sources cover it.</p>
          
          <form className="space-y-4" onSubmit={handleCompare}>
            <div>
              <Label htmlFor="topic" className="text-sm font-medium text-neutral-medium">News Topic</Label>
              <Input
                type="text"
                id="topic"
                placeholder="e.g., Infrastructure Bill, Election Results"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="src-nyt" 
                  checked={sources.nyt}
                  onCheckedChange={() => handleSourceChange('nyt')}
                />
                <label htmlFor="src-nyt" className="text-sm text-neutral-dark">New York Times</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="src-wsj" 
                  checked={sources.wsj}
                  onCheckedChange={() => handleSourceChange('wsj')}
                />
                <label htmlFor="src-wsj" className="text-sm text-neutral-dark">Wall Street Journal</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="src-fox" 
                  checked={sources.fox}
                  onCheckedChange={() => handleSourceChange('fox')}
                />
                <label htmlFor="src-fox" className="text-sm text-neutral-dark">Fox News</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="src-cnn" 
                  checked={sources.cnn}
                  onCheckedChange={() => handleSourceChange('cnn')}
                />
                <label htmlFor="src-cnn" className="text-sm text-neutral-dark">CNN</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="src-npr" 
                  checked={sources.npr}
                  onCheckedChange={() => handleSourceChange('npr')}
                />
                <label htmlFor="src-npr" className="text-sm text-neutral-dark">NPR</label>
              </div>
            </div>
            
            <div>
              <Button 
                type="submit"
                disabled={compareSourcesMutation.isPending}
              >
                {compareSourcesMutation.isPending ? "Comparing..." : "Compare Sources"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {compareSourcesMutation.isPending && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-sm text-neutral-medium">Comparing sources...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-6">Comparison Results: "{topic}"</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Headline</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Bias Score</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-medium uppercase tracking-wider">Key Narrative</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {result.source.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-neutral-dark">{result.source}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-dark">{result.headline}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-24">
                          <BiasScale score={result.biasScore} mini />
                        </div>
                        <span className={`text-xs ${getBiasTextColor(result.biasScore)}`}>
                          {getBiasText(result.biasScore)} ({result.biasScore})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-dark">
                        {result.keyNarrative}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium mb-4">Side-by-Side Content Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-sm mb-2">{source.source}</h4>
                    <div className="space-y-3 text-sm">
                      {source.contentAnalysis.map((content, i) => (
                        <p key={i} className="text-neutral-dark" 
                          dangerouslySetInnerHTML={{ 
                            __html: content
                              .replace(/<span class="bg-green-100">(.*?)<\/span>/g, '<span class="bg-green-100">$1</span>')
                              .replace(/<span class="bg-red-100">(.*?)<\/span>/g, '<span class="bg-red-100">$1</span>')
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
