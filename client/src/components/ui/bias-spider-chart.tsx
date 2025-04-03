import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

// For multidimensional bias analysis (single entity)
export interface BiasSpiderData {
  name: string;
  value: number;
}

interface BiasSpiderChartProps {
  data: BiasSpiderData[];
  className?: string;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export function BiasSpiderChart({ 
  data, 
  className = '', 
  height = 300,
  color = '#10b981', // Default emerald color similar to the screenshot
  fillOpacity = 0.5,
  strokeWidth = 1.5
}: BiasSpiderChartProps) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart 
          cx="50%" 
          cy="50%" 
          outerRadius="80%" 
          data={data}
        >
          <PolarGrid stroke="#334155" strokeWidth={0.5} />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            axisLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickCount={5}
            stroke="#475569"
          />
          <Radar
            name="Bias Analysis"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={fillOpacity}
            strokeWidth={strokeWidth}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}