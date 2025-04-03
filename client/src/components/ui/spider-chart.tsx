import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// Represents a single media source's multidimensional analysis data
export interface SpiderChartDataPoint {
  source: string;
  biasScore: number;
  emotionalTone: number;
  factualFocus: number;
  framingScore: number;
  color?: string;
}

interface SpiderChartProps {
  data: SpiderChartDataPoint[];
  className?: string;
  height?: number;
  legendPosition?: 'top' | 'bottom';
}

// Transform the data for RadarChart - from array of objects to array of dimension data
const transformDataForRadarChart = (data: SpiderChartDataPoint[]) => {
  // Define the dimensions we want to display
  const dimensions = [
    { key: 'biasScore', name: 'Bias', inverted: true },
    { key: 'emotionalTone', name: 'Emotional', inverted: true },
    { key: 'factualFocus', name: 'Factual', inverted: false },
    { key: 'framingScore', name: 'Framing', inverted: true }
  ];
  
  // For each dimension, create an object with source values
  return dimensions.map(dim => {
    const result: any = { dimension: dim.name };
    
    // For each source, add its value for this dimension
    data.forEach(source => {
      // Some dimensions need to be inverted (100 - value) to represent "better" as further out
      // For example, high bias score is bad, so we invert it
      const value = dim.inverted ? 
        100 - (source[dim.key as keyof SpiderChartDataPoint] as number) : 
        source[dim.key as keyof SpiderChartDataPoint] as number;
      
      result[source.source] = value;
    });
    
    return result;
  });
};

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export function SpiderChart({ 
  data, 
  className = '', 
  height = 300,
  legendPosition = 'bottom'
}: SpiderChartProps) {
  // Transform the data for RadarChart
  const radarData = transformDataForRadarChart(data);
  
  // Get the list of sources for labels
  const sources = data.map(d => d.source);
  
  return (
    <div className={`w-full h-[${height}px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radarData}>
          <PolarGrid stroke="#2d3748" />
          <PolarAngleAxis 
            dataKey="dimension" 
            tick={{ fill: '#a0aec0', fontSize: 12 }} 
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            stroke="#2d3748"
            tick={{ fill: '#a0aec0', fontSize: 10 }}
          />
          
          {/* Create one radar for each source */}
          {sources.map((source, index) => (
            <Radar
              key={source}
              name={source}
              dataKey={source}
              stroke={data[index].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              fill={data[index].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              fillOpacity={0.5}
            />
          ))}
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              borderColor: '#475569',
              color: '#e2e8f0',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
          />
          
          <Legend
            align="center"
            verticalAlign={legendPosition}
            layout="horizontal"
            wrapperStyle={{
              paddingTop: legendPosition === 'bottom' ? '20px' : '0',
              paddingBottom: legendPosition === 'top' ? '20px' : '0',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}