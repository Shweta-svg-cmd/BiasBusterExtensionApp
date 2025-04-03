import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BiasScale from "@/components/ui/bias-scale";
import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";

export default function HistoryTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
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
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
          <h2 className="text-xl font-semibold">Your Analysis History</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search history..."
                className="pl-8 pr-3 py-1.5 text-sm"
                value={searchTerm}
                onChange={handleHistorySearch}
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-neutral-medium">🔍</span>
            </div>
            <Select value={sourceFilter} onValueChange={handleHistoryFilter}>
              <SelectTrigger className="text-sm py-1.5 px-3 w-full sm:w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="nyt">New York Times</SelectItem>
                <SelectItem value="wsj">Wall Street Journal</SelectItem>
                <SelectItem value="fox">Fox News</SelectItem>
                <SelectItem value="cnn">CNN</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="overflow-hidden shadow ring-1 ring-slate-700 rounded-lg">
              <table className="min-w-full divide-y divide-slate-700">
                <thead className="bg-slate-800">
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
                <tbody className="divide-y divide-slate-700 bg-slate-900">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/50'}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-300 sm:pl-6">
                          {item.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">{item.source || 'Unknown'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-400">
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
                          <button className="text-primary hover:text-blue-400 transition-colors">
                            View details
                          </button>
                        </td>
                      </tr>
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
              <div className="text-sm text-neutral-medium">
                {totalCount ? (
                  <>
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{" "}
                    <span className="font-medium">{totalCount}</span> results
                  </>
                ) : (
                  "No results"
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
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
