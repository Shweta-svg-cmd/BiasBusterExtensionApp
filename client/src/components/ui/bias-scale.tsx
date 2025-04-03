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
    if (score < 30) return "Very Conservative";
    if (score < 40) return "Conservative";
    if (score < 45) return "Leaning Conservative";
    if (score >= 45 && score <= 55) return "Neutral/Centrist";
    if (score < 65) return "Leaning Liberal";
    if (score < 75) return "Liberal";
    return "Very Liberal";
  };
  
  const getBiasMarkerColor = () => {
    // Match our barchart color scheme
    if (normalizedScore < 30) return "bg-[#3a0ca3]"; // Very Conservative
    if (normalizedScore < 40) return "bg-[#4361ee]"; // Conservative
    if (normalizedScore < 45) return "bg-[#3a86ff]"; // Leaning Conservative
    if (normalizedScore >= 45 && normalizedScore <= 55) return "bg-[#06d6a0]"; // Neutral/Centrist
    if (normalizedScore < 65) return "bg-[#f72585]"; // Leaning Liberal
    if (normalizedScore < 75) return "bg-[#7209b7]"; // Liberal
    return "bg-[#9d4edd]"; // Very Liberal
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
      <div className="h-2 rounded-full bg-gradient-to-r from-[#3a0ca3] via-[#06d6a0] to-[#9d4edd] relative">
        <div 
          className={`w-6 h-6 rounded-full border-2 border-gray-900 shadow-lg absolute transform -translate-x-1/2 -translate-y-1/2 ${getBiasMarkerColor()}`} 
          style={{ 
            left: `${position}%`, 
            top: mini ? "50%" : "50%" 
          }}
        />
      </div>
    </div>
  );
}
