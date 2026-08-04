import React from 'react'
import { IconType } from 'react-icons'

interface StatCardProps {
  title: string
  value: string | number
  icon: IconType
  color?: string
  subtitle?: string
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = 'bg-primary-500',
  subtitle,
  trend,
}) => {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default StatCard