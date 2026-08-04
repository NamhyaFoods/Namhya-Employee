import React, { useState } from 'react'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (row: T) => void
  loading?: boolean
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  loading = false,
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: keyof T) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(key)
      setSortDirection('asc')
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortField, sortDirection])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                onClick={() => col.sortable !== false && col.key && handleSort(col.key as keyof T)}
              >
                <div className="flex items-center space-x-1">
                  <span>{col.header}</span>
                  {col.sortable !== false && sortField === col.key && (
                    <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          ) : (
            sortedData.map((row, index) => (
              <tr
                key={index}
                className={`hover:bg-gray-50 transition-colors ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {col.render ? col.render(row[col.key as keyof T], row) : row[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable