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

  const getBiasLabel = (score: number) => {
    if (score <= -5) return "Conservative";
    if (score < 0) return "Conservative";
    if (score === 0) return "Neutral";
    if (score < 5) return "Liberal";
    return "Liberal";
  };

  const getBiasLabelColor = (score: number) => {
    if (score < 0) return "text-status-error";
    if (score === 0) return "text-status-warning";
    return "text-status-success";
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
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-neutral-medium sm:pl-6">Article Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-medium">Source</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-medium">Date Analyzed</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-neutral-medium">Bias Rating</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-neutral-dark sm:pl-6">
                          {item.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-medium">{item.source || 'Unknown'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-neutral-medium">
                          {new Date(item.analyzedAt).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div className="w-24">
                            <BiasScale score={item.biasScore} mini />
                          </div>
                          <span className={`text-xs ${getBiasLabelColor(item.biasScore)}`}>
                            {getBiasLabel(item.biasScore)}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <a href="#" className="text-primary hover:text-blue-900">View<span className="sr-only">, item</span></a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-neutral-medium">
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
