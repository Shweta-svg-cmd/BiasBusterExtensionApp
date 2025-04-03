import React from "react";

interface BiasScaleProps {
  score: number; // Can be 0-100 or -10 to 10
  mini?: boolean;
  maxScore?: number; // Maximum possible score (100 by default)
}

export default function BiasScale({ score, mini = false, maxScore = 100 }: BiasScaleProps) {
  // If score is on the -10 to 10 scale, convert it to 0-100
  const normalizedScore = maxScore === 20 
    ? (score + 10) * 5 // Convert -10 to 10 scale to 0-100
    : score; // Already 0-100 scale
  
  // Position on the slider (0% to 100%)
  const position = normalizedScore;
  
  const getBiasLabel = (score: number) => {
    if (score < 25) return "Low Bias";
    if (score < 50) return "Moderate Bias";
    if (score < 75) return "High Bias";
    return "Extreme Bias";
  };
  
  const getBiasMarkerColor = () => {
    // For bias score, lower is better (less biased)
    if (normalizedScore < 25) return "bg-emerald-500"; // Low bias - green
    if (normalizedScore < 50) return "bg-yellow-500"; // Moderate bias - yellow
    return "bg-red-500"; // High bias - red
  };

  return (
    <div className={`mb-4 relative ${mini ? "" : "mb-4"}`}>
      {!mini && (
        <div className="text-center mb-2 text-xl font-bold text-white">
          {normalizedScore}/100
          <div className="text-sm font-normal text-gray-300 mt-1">
            {getBiasLabel(normalizedScore)}
          </div>
        </div>
      )}
      <div className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500">
        <div 
          className={`w-6 h-6 rounded-full border-2 border-white shadow-md absolute transform -translate-x-1/2 -translate-y-1/2 ${getBiasMarkerColor()}`} 
          style={{ 
            left: `${position}%`, 
            top: mini ? "50%" : "50%" 
          }}
        />
      </div>
    </div>
  );
}
