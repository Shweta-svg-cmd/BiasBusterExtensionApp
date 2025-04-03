import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

interface CustomTooltipProps extends TooltipProps<any, any> {
  colorScheme?: string[];
}

interface BiasBarChartProps {
  data: Array<{
    name: string;
    value: number;
    category?: string;
    [key: string]: any;
  }>;
  dataKey?: string;
  className?: string;
  horizontal?: boolean;
  xAxisDataKey?: string;
  colorScheme?: string[];
  domain?: [number, number];
  tooltipFormatter?: (value: number, name: string, props: any) => React.ReactNode;
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  valueFormatter?: (value: number) => string;
  height?: number;
}

const DEFAULT_COLORS = [
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
  '#7c3aed', // violet-600
  '#8b5cf6', // violet-500
  '#a78bfa', // violet-400
  '#c4b5fd', // violet-300
];

const NEUTRAL_COLORS = [
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
];

const BIAS_COLORS = [
  '#3a0ca3', // indigo-dark - Very Conservative
  '#4361ee', // royal-blue - Conservative
  '#3a86ff', // blue-azure - Leaning Conservative
  '#06d6a0', // teal-green - Neutral/Centrist
  '#f72585', // hot-pink - Leaning Liberal
  '#7209b7', // purple-violet - Liberal
  '#9d4edd', // purple-orchid - Very Liberal
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, colorScheme }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const value = payload[0].value;
    const formattedValue = typeof value === 'number' ? value.toFixed(0) : value;
    const category = data.category || '';
    const explanation = data.explanation || '';
    
    // Choose a color based on the value or category if available
    let borderColor = '#3b82f6'; // blue-500
    
    if (data.colorIndex !== undefined && colorScheme && colorScheme[data.colorIndex]) {
      borderColor = colorScheme[data.colorIndex];
    }

    // Get label for the bias score
    const getBiasLabel = (score: number) => {
      if (score < 30) return "Very Conservative";
      if (score < 40) return "Conservative";
      if (score < 45) return "Leaning Conservative";
      if (score >= 45 && score <= 55) return "Neutral/Centrist";
      if (score < 65) return "Leaning Liberal";
      if (score < 75) return "Liberal";
      return "Very Liberal";
    };

    return (
      <div className="bg-slate-800 border border-slate-700 shadow-lg rounded-md px-4 py-3 text-sm"
           style={{ borderLeft: `4px solid ${borderColor}` }}>
        <p className="font-bold text-slate-100 text-base">{label}</p>
        {category && (
          <p className="text-slate-300 mt-1">{category}</p>
        )}
        <div className="mt-2 flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: borderColor }}></div>
          <span className="font-medium text-slate-200">
            Score: {formattedValue} - {getBiasLabel(Number(formattedValue))}
          </span>
        </div>
        {explanation && (
          <p className="mt-2 text-slate-400 text-xs italic border-t border-slate-700 pt-2">{explanation}</p>
        )}
      </div>
    );
  }

  return null;
};

export const BiasBarChart = ({
  data,
  dataKey = 'value',
  className = '',
  horizontal = false,
  xAxisDataKey = 'name',
  colorScheme = DEFAULT_COLORS,
  domain = [0, 100],
  tooltipFormatter,
  tooltipLabelFormatter,
  valueFormatter = (value) => `${value}`,
  height = 300,
}: BiasBarChartProps) => {
  // Assign colors based on whether the data has a bias value
  // (lower values are blue, middle is green, higher values are red)
  const getColorIndex = (value: number) => {
    if (domain[1] === 100) { // Assuming this is bias data
      if (value < 30) return 0; // Very Conservative bias
      if (value < 40) return 1; // Conservative bias 
      if (value < 45) return 2; // Leaning Conservative
      if (value >= 45 && value <= 55) return 3; // Neutral/Centrist
      if (value < 65) return 4; // Leaning Liberal
      if (value < 75) return 5; // Liberal
      return 6; // Very Liberal bias
    }
    // For other data types, distribute colors evenly
    return Math.floor((value / domain[1]) * (colorScheme.length - 1));
  };

  // Prepare data with color indices
  const dataWithColors = data.map(item => ({
    ...item,
    colorIndex: getColorIndex(item[dataKey] as number)
  }));

  // Choose which color scheme to use based on the domain
  const chosenColorScheme = domain[1] === 100 ? BIAS_COLORS : colorScheme;

  return (
    <div className={`w-full h-[${height}px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        {horizontal ? (
          <RechartsBarChart
            data={dataWithColors}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" horizontal={false} />
            <XAxis 
              type="number" 
              domain={domain} 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              stroke="#2d3748"
            />
            <YAxis 
              dataKey={xAxisDataKey}
              type="category" 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              stroke="#2d3748"
              width={80}
            />
            <Tooltip 
              content={<CustomTooltip colorScheme={chosenColorScheme} />}
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
            />
            <Bar 
              dataKey={dataKey} 
              radius={[0, 4, 4, 0]} 
              barSize={30}
              animationDuration={1000}
            >
              {dataWithColors.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={chosenColorScheme[entry.colorIndex || index % chosenColorScheme.length]}
                  stroke="#0f172a"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        ) : (
          <RechartsBarChart
            data={dataWithColors}
            margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
            <XAxis 
              dataKey={xAxisDataKey} 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              stroke="#2d3748"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis 
              domain={domain} 
              tick={{ fill: '#a0aec0', fontSize: 12 }}
              stroke="#2d3748"
            />
            <Tooltip 
              content={<CustomTooltip colorScheme={chosenColorScheme} />}
              formatter={tooltipFormatter}
              labelFormatter={tooltipLabelFormatter}
            />
            <Bar 
              dataKey={dataKey} 
              radius={[4, 4, 0, 0]} 
              barSize={45}
              animationDuration={1000}
            >
              {dataWithColors.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={chosenColorScheme[entry.colorIndex || index % chosenColorScheme.length]}
                  stroke="#0f172a"
                  strokeWidth={1}
                />
              ))}
            </Bar>
          </RechartsBarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};