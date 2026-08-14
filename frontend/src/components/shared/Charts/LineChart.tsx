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
import { useTheme } from '../../../contexts/ThemeContext'

interface LineChartProps {
  data: any[]
  xKey: string
  lines: { key: string; color: string }[]
  height?: number
}

// Recharts writes these as raw SVG attributes, so a CSS var reference won't
// resolve here the way it does in Tailwind classes — mirror the two palettes
// from styles/variables.css directly.
const CHART_PALETTE = {
  dark: { grid: '#1E293F', axis: '#8B98AC', tooltipBg: '#16223B', tooltipBorder: '#1E293F', tooltipText: '#F8FAFC', label: '#CBD5E1' },
  light: { grid: '#E2E8F0', axis: '#64748B', tooltipBg: '#FFFFFF', tooltipBorder: '#E2E8F0', tooltipText: '#0F172A', label: '#334155' },
}

const LineChart: React.FC<LineChartProps> = ({ data, xKey, lines, height = 300 }) => {
  const { theme } = useTheme()
  const c = CHART_PALETTE[theme]

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
        <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
        <XAxis dataKey={xKey} stroke={c.axis} tick={{ fill: c.axis, fontSize: 12 }} />
        <YAxis stroke={c.axis} tick={{ fill: c.axis, fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 8, color: c.tooltipText }}
          labelStyle={{ color: c.label }}
        />
        <Legend wrapperStyle={{ color: c.axis, fontSize: 12 }} />
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