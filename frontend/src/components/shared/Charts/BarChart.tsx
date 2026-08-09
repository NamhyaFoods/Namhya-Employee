import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface BarChartProps {
  data: any[]
  xKey: string
  bars: { key: string; color: string }[]
  height?: number
}

const BarChart: React.FC<BarChartProps> = ({ data, xKey, bars, height = 300 }) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          {bars.map((bar) => (
            <linearGradient key={bar.key} id={`bar-fill-${bar.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={bar.color} stopOpacity={0.95} />
              <stop offset="100%" stopColor={bar.color} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293F" />
        <XAxis dataKey={xKey} stroke="#8B98AC" tick={{ fill: '#8B98AC', fontSize: 12 }} />
        <YAxis stroke="#8B98AC" tick={{ fill: '#8B98AC', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: '#16223B', border: '1px solid #1E293F', borderRadius: 8, color: '#F8FAFC' }}
          labelStyle={{ color: '#CBD5E1' }}
          cursor={{ fill: 'rgba(59,130,246,0.06)' }}
        />
        <Legend wrapperStyle={{ color: '#8B98AC', fontSize: 12 }} />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={`url(#bar-fill-${bar.key})`} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart