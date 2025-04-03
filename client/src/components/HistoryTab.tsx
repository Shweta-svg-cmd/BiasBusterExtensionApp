import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BiasScale from "@/components/ui/bias-scale";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiasRadarChart, BiasRadarData } from "@/components/ui/radar-chart";
import { ScrollArea } from "@/components/ui/scroll-area";

// Article detail dialog component
function ArticleDetailDialog({ articleId }: { articleId: number }) {
  const [activeTab, setActiveTab] = useState("analysis");
  
  const { data: article, isLoading } = useQuery<Article>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });
  
  // Convert multidimensional analysis to radar chart format
  const getRadarData = (): BiasRadarData[] => {
    if (!article?.multidimensionalAnalysis) return [];
    
    const { bias, emotional, factual, political, neutralLanguage } = article.multidimensionalAnalysis;
    
    return [
      { name: "Bias", value: bias, fullMark: 100 },
      { name: "Emotional", value: emotional, fullMark: 100 },
      { name: "Factual", value: factual, fullMark: 100 },
      { name: "Political", value: political, fullMark: 100 },
      { name: "Neutral Language", value: neutralLanguage, fullMark: 100 },
    ];
  };
  
  if (isLoading || !article) {
    return (
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-white">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DialogContent>
    );
  }
  
  return (
    <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-white">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          {article.title}
        </DialogTitle>
        <DialogDescription className="text-slate-400">
          {article.source} • {new Date(article.analyzedAt).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>
      
      <Tabs defaultValue="analysis" value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="bg-slate-800 border-slate-700 grid grid-cols-3">
          <TabsTrigger value="analysis" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">Analysis</TabsTrigger>
          <TabsTrigger value="side-by-side" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">Side by Side</TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-violet-600 data-[state=active]:text-white">Bias Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="mt-4">
          <div className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Bias Score: {article.biasScore}/100</h3>
                <BiasScale score={article.biasScore} maxScore={100} />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400">Political Leaning</h4>
                    <p className="text-white font-semibold">{article.politicalLeaning}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400">Emotional Language</h4>
                    <p className="text-white font-semibold">{article.emotionalLanguage}</p>
                  </div>
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-gray-400">Factual Reporting</h4>
                    <p className="text-white font-semibold">{article.factualReporting}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Bias Analysis</h3>
                <p className="text-gray-300 whitespace-pre-line">{article.biasAnalysis}</p>
              </CardContent>
            </Card>
            
            {article.biasedPhrases && article.biasedPhrases.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Biased Phrases</h3>
                  <ul className="space-y-3">
                    {article.biasedPhrases.map((phrase, index) => (
                      <li key={index} className="bg-gray-900 p-3 rounded-lg">
                        <p className="text-white font-medium mb-1">"{phrase.text}"</p>
                        <p className="text-gray-400 text-sm">{phrase.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="side-by-side" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700 h-[600px]">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Original Article</h3>
                <ScrollArea className="h-[550px] rounded-md border border-gray-700 p-4">
                  <div className="text-gray-300 whitespace-pre-line">{article.content}</div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800 border-gray-700 h-[600px]">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Neutral Version</h3>
                <ScrollArea className="h-[550px] rounded-md border border-gray-700 p-4">
                  <div className="text-gray-300 whitespace-pre-line">{article.neutralText}</div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Multidimensional Analysis</h3>
              <div className="flex justify-center py-4">
                <BiasRadarChart data={getRadarData()} className="max-w-md w-full h-80" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                {article.multidimensionalAnalysis && Object.entries(article.multidimensionalAnalysis).map(([key, value]) => (
                  <div key={key} className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-medium text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <div className="flex items-center mt-1">
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold ml-2">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {article.topics && (
            <Card className="bg-gray-800 border-gray-700 mt-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold text-white mb-2">Topics</h3>
                <div className="flex flex-col space-y-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Main Topic</h4>
                    <p className="text-white">{article.topics.main}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400">Related Topics</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {article.topics.related.map((topic, index) => (
                        <span key={index} className="bg-gray-900 text-gray-300 px-2 py-1 rounded-md text-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}

export default function HistoryTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const { data: historyItems, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/history", sourceFilter, currentPage, itemsPerPage],
  });

  const { data: totalCount } = useQuery<number>({
    queryKey: ["/api/articles/count", sourceFilter, searchTerm],
  });

  const filteredItems = historyItems
    ? historyItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (item.source && item.source.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const totalPages = totalCount ? Math.ceil(totalCount / itemsPerPage) : 1;

  const handleHistorySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleHistoryFilter = (value: string) => {
    setSourceFilter(value);
    setCurrentPage(1); // Reset to first page on new filter
  };

  // Updated for 0-100 scale
  const getBiasLabel = (score: number) => {
    if (score < 35) return "Conservative";
    if (score < 45) return "Leaning Conservative";
    if (score >= 45 && score <= 55) return "Neutral/Centrist";
    if (score < 65) return "Leaning Liberal";
    return "Liberal";
  };

  const getBiasLabelColor = (score: number) => {
    if (score < 35) return "text-blue-500"; // Conservative
    if (score < 45) return "text-blue-400"; // Somewhat Conservative
    if (score >= 45 && score <= 55) return "text-green-500"; // Neutral
    if (score < 65) return "text-red-400"; // Somewhat liberal
    return "text-red-500"; // Liberal
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <h2 className="text-xl font-semibold text-white">Your Analysis History</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search history..."
                className="pl-8 pr-3 py-1.5 text-sm bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-400 focus:border-blue-600 focus:ring-blue-600"
                value={searchTerm}
                onChange={handleHistorySearch}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            <Select value={sourceFilter} onValueChange={handleHistoryFilter}>
              <SelectTrigger className="text-sm py-1.5 px-3 w-full sm:w-40 bg-gray-800 border-gray-700 text-gray-200">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all" className="text-gray-200 focus:bg-blue-900">All Sources</SelectItem>
                <SelectItem value="nyt" className="text-gray-200 focus:bg-blue-900">New York Times</SelectItem>
                <SelectItem value="wsj" className="text-gray-200 focus:bg-blue-900">Wall Street Journal</SelectItem>
                <SelectItem value="fox" className="text-gray-200 focus:bg-blue-900">Fox News</SelectItem>
                <SelectItem value="cnn" className="text-gray-200 focus:bg-blue-900">CNN</SelectItem>
                <SelectItem value="other" className="text-gray-200 focus:bg-blue-900">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden shadow rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-black">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider sm:pl-6">Article Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Source</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date Analyzed</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Bias Rating</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-black">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => (
                      <Dialog key={item.id} open={selectedArticleId === item.id} onOpenChange={(open) => !open && setSelectedArticleId(null)}>
                        <DialogTrigger asChild>
                          <tr 
                            className={`${index % 2 === 0 ? 'bg-black' : 'bg-slate-900/30'} cursor-pointer hover:bg-slate-800/50 transition-colors`}
                            onClick={() => setSelectedArticleId(item.id)}
                          >
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-300 sm:pl-6">
                              {item.title}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">{item.source || 'Unknown'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-400">
                              {new Date(item.analyzedAt).toLocaleDateString()}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <div className="w-24">
                                <BiasScale score={item.biasScore} mini maxScore={100} />
                              </div>
                              <span className={`text-xs ${getBiasLabelColor(item.biasScore)}`}>
                                {getBiasLabel(item.biasScore)}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <span className="text-indigo-400 flex items-center justify-end">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 15l-6-6-6 6"/>
                                </svg>
                              </span>
                            </td>
                          </tr>
                        </DialogTrigger>
                        {selectedArticleId === item.id && (
                          <ArticleDetailDialog articleId={item.id} />
                        )}
                      </Dialog>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                        No results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
                {totalCount ? (
                  <>
                    Showing <span className="font-medium text-gray-300">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium text-gray-300">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{" "}
                    <span className="font-medium text-gray-300">{totalCount}</span> results
                  </>
                ) : (
                  "No results"
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  disabled={currentPage === totalPages || totalPages === 0} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
