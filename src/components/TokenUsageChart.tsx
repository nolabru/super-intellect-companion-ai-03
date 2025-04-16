
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer,
  Tooltip,
  Legend 
} from 'recharts';

interface TokenUsageData {
  date: string;
  usado: number;
  limite: number;
}

interface TokenUsageChartProps {
  data: TokenUsageData[];
  className?: string;
}

const TokenUsageChart: React.FC<TokenUsageChartProps> = ({ data, className }) => {
  const config = {
    usado: {
      label: "Tokens Usados",
      color: "#7c3aed" // Cor roxa (inventu-purple)
    },
    limite: {
      label: "Limite de Tokens",
      color: "#3b82f6" // Cor azul (inventu-blue)
    }
  };

  return (
    <div className={`w-full h-64 ${className || ''}`}>
      <ChartContainer config={config}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            axisLine={{ stroke: '#4B5563' }} 
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
          />
          <YAxis 
            axisLine={{ stroke: '#4B5563' }} 
            tick={{ fill: '#9CA3AF' }}
            tickLine={{ stroke: '#4B5563' }}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-inventu-dark border border-inventu-gray/20 p-3 rounded-md shadow-lg">
                    <p className="text-white font-medium">{payload[0].payload.date}</p>
                    <p className="text-inventu-purple">
                      <span className="font-medium">Usados:</span> {payload[0].value}
                    </p>
                    <p className="text-inventu-blue">
                      <span className="font-medium">Limite:</span> {payload[1].value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-white opacity-80">{value}</span>}
          />
          <Line 
            type="monotone" 
            dataKey="usado" 
            stroke="#7c3aed" 
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="limite" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
};

export default TokenUsageChart;
