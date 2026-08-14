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
import { useTheme } from '../../../contexts/ThemeContext'

interface BarChartProps {
  data: any[]
  xKey: string
  bars: { key: string; color: string }[]
  height?: number
}

// Recharts writes these as raw SVG attributes, so a CSS var reference won't
// resolve here the way it does in Tailwind classes — mirror the two palettes
// from styles/variables.css directly.
const CHART_PALETTE = {
  dark: { grid: '#1E293F', axis: '#8B98AC', tooltipBg: '#16223B', tooltipBorder: '#1E293F', tooltipText: '#F8FAFC', label: '#CBD5E1' },
  light: { grid: '#E2E8F0', axis: '#64748B', tooltipBg: '#FFFFFF', tooltipBorder: '#E2E8F0', tooltipText: '#0F172A', label: '#334155' },
}

const BarChart: React.FC<BarChartProps> = ({ data, xKey, bars, height = 300 }) => {
  const { theme } = useTheme()
  const c = CHART_PALETTE[theme]

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
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey={xKey} stroke={c.axis} tick={{ fill: c.axis, fontSize: 12 }} />
        <YAxis stroke={c.axis} tick={{ fill: c.axis, fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, color: c.tooltipText }}
          labelStyle={{ color: c.label }}
          cursor={{ fill: 'rgba(59,130,246,0.06)' }}
        />
        <Legend wrapperStyle={{ color: c.axis, fontSize: 12 }} />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={`url(#bar-fill-${bar.key})`} radius={[4, 4, 0, 0]} />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export default BarChart