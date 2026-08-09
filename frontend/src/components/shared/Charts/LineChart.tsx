import React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface LineChartProps {
  data: any[]
  xKey: string
  lines: { key: string; color: string }[]
  height?: number
}

const LineChart: React.FC<LineChartProps> = ({ data, xKey, lines, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {lines.map((line) => (
            <filter key={line.key} id={`line-glow-${line.key}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293F" />
        <XAxis dataKey={xKey} stroke="#8B98AC" tick={{ fill: '#8B98AC', fontSize: 12 }} />
        <YAxis stroke="#8B98AC" tick={{ fill: '#8B98AC', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#16223B', border: '1px solid #1E293F', borderRadius: 8, color: '#F8FAFC' }}
          labelStyle={{ color: '#CBD5E1' }}
        />
        <Legend wrapperStyle={{ color: '#8B98AC', fontSize: 12 }} />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: line.color, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            filter={`url(#line-glow-${line.key})`}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export default LineChart