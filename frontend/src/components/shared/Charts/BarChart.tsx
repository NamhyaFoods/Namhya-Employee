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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart