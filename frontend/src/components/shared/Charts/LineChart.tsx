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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line) => (
          <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export default LineChart