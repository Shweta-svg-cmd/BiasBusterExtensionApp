import { useState } from "react";
import AnalysisTab from "@/components/AnalysisTab";
import ComparisonTab from "@/components/ComparisonTab";
import HistoryTab from "@/components/HistoryTab";

export default function Home() {
  const [activeTab, setActiveTab] = useState("analyze");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            id="analyze"
            onClick={() => setActiveTab("analyze")}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === "analyze"
                ? "border-primary text-primary border-b-2"
                : "border-transparent text-neutral-medium hover:text-primary hover:border-primary border-b-2"
            }`}
          >
            Article Analysis
          </button>
          <button
            id="compare"
            onClick={() => setActiveTab("compare")}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === "compare"
                ? "border-primary text-primary border-b-2"
                : "border-transparent text-neutral-medium hover:text-primary hover:border-primary border-b-2"
            }`}
          >
            Source Comparison
          </button>
          <button
            id="history"
            onClick={() => setActiveTab("history")}
            className={`py-2 px-1 text-sm font-medium ${
              activeTab === "history"
                ? "border-primary text-primary border-b-2"
                : "border-transparent text-neutral-medium hover:text-primary hover:border-primary border-b-2"
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "analyze" && <AnalysisTab />}
      {activeTab === "compare" && <ComparisonTab />}
      {activeTab === "history" && <HistoryTab />}
    </div>
  );
}
