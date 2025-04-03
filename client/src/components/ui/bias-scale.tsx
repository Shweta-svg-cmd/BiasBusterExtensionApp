import React from "react";

interface BiasScaleProps {
  score: number;
  mini?: boolean;
}

export default function BiasScale({ score, mini = false }: BiasScaleProps) {
  // Convert score (-10 to 10) to percentage (0% to 100%)
  const position = (score + 10) * 5;
  
  const getBiasMarkerColor = (score: number) => {
    if (score < 0) return "bg-status-error";
    if (score === 0) return "bg-status-warning";
    return "bg-status-success";
  };

  return (
    <div className={`mb-4 relative ${mini ? "" : "mb-4"}`}>
      {!mini && (
        <>
          <div className="absolute -top-6 left-0 text-xs text-status-error">Conservative</div>
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-status-warning">Neutral</div>
          <div className="absolute -top-6 right-0 text-xs text-status-success">Liberal</div>
        </>
      )}
      <div className="h-2 rounded bg-gradient-to-r from-status-error via-status-warning to-status-success">
        <div 
          className={`w-4 h-4 rounded-full border-2 border-white shadow-md absolute transform -translate-x-1/2 -translate-y-1/2 ${getBiasMarkerColor(score)}`} 
          style={{ 
            left: `${position}%`, 
            top: mini ? "50%" : "4px" 
          }}
        />
      </div>
    </div>
  );
}
