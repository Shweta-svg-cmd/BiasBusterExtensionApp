import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface BiasRadarData {
  name: string;
  value: number;
  fullMark: number;
}

interface BiasRadarChartProps {
  data: BiasRadarData[];
  className?: string;
}

export function BiasRadarChart({ data, className }: BiasRadarChartProps) {
  return (
    <div className={`w-full h-[300px] ${className || ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#2d3748" />
          <PolarAngleAxis 
            dataKey="name" 
            stroke="#a0aec0" 
            tick={{ fill: '#a0aec0', fontSize: 12 }} 
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            stroke="#2d3748"
            tick={{ fill: '#a0aec0', fontSize: 10 }}
          />
          <Radar
            name="Bias Score"
            dataKey="value"
            stroke="#3b82f6"
            fill="#2563eb"
            fillOpacity={0.7}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderColor: '#1e40af',
              color: '#e2e8f0',
              borderRadius: '6px',
              padding: '10px',
            }}
            formatter={(value: number) => [`${value}/100`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}