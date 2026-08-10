import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import DataTable from '../../components/shared/Tables/DataTable'
// Remove Input - not used
// import Input from '../../components/shared/Forms/Input'
import Select from '../../components/shared/Forms/Select'
import Spinner from '../../components/common/Loading/Spinner'
import { reviewsApi } from '../../api/reviews'
import { usersApi } from '../../api/users'
import { Review } from '../../types/performance'
import { formatDate, formatScore, getScoreCategory, getScoreColor } from '../../utils/formatters'
// Remove FaCalendar - not used
// import { FaCalendar, FaPlus, FaDownload } from 'react-icons/fa'
import { FaPlus, FaDownload } from 'react-icons/fa'
import toast from 'react-hot-toast'

const MonthlyReview: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>([])
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterReviews()
  }, [reviews, selectedMonth, selectedEmployee])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Was calling reviewsApi.getMyReviews(100), which fetches reviews
      // for the logged-in admin's own user id. Admins don't have
      // performance_reviews rows themselves (only employees get monthly
      // reviews), so this page always rendered zero rows regardless of
      // how many employees had actually been reviewed. getAll() hits the
      // new admin-only /reviews/ endpoint that returns reviews across
      // every employee.
      const [reviewsData, usersData] = await Promise.all([
        reviewsApi.getAll(100),
        usersApi.getAll(),
      ])

      setReviews(reviewsData)
      setFilteredReviews(reviewsData)

      // Get pending reviews
      const pendingData = await reviewsApi.getPending()
      // Use pendingData if needed, or remove the variable
      console.log('Pending reviews:', pendingData)
      
      setEmployees(usersData.filter((u: any) => 
        u.role === 'employee' && u.is_active === true
      ))
    } catch (error) {
      toast.error('Failed to fetch review data')
    } finally {
      setLoading(false)
    }
  }

  const filterReviews = () => {
    let filtered = [...reviews]

    if (selectedMonth) {
      filtered = filtered.filter((r) => 
        r.review_month.startsWith(selectedMonth)
      )
    }

    if (selectedEmployee) {
      filtered = filtered.filter((r) => r.user_id === selectedEmployee)
    }

    setFilteredReviews(filtered)
  }

  const handleGenerateReviews = async () => {
    if (!window.confirm('Generate monthly reviews for all employees?')) return

    try {
      setGenerating(true)
      const result = await reviewsApi.generateAll()
      toast.success(`Generated ${result.generated} reviews`)
      fetchData()
    } catch (error) {
      toast.error('Failed to generate reviews')
    } finally {
      setGenerating(false)
    }
  }

  const columns = [
    {
      key: 'full_name' as keyof Review,
      header: 'Employee',
      render: (value: string, row: Review) => (
        <div>
          <div className="font-medium">{value || row.user_id}</div>
          <div className="text-sm text-gray-500">ID: {row.user_id.slice(0, 8)}</div>
        </div>
      ),
    },
    {
      key: 'review_month' as keyof Review,
      header: 'Month',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'total_tasks_assigned' as keyof Review,
      header: 'Tasks',
      render: (value: number, row: Review) => (
        <div>
          <div>{value}</div>
          <div className="text-sm text-gray-500">
            Completed: {row.total_tasks_completed}
          </div>
        </div>
      ),
    },
    {
      key: 'completion_rate' as keyof Review,
      header: 'Completion',
      render: (value: number) => (
        <span className="font-medium">{value.toFixed(1)}%</span>
      ),
    },
    {
      key: 'average_efficiency' as keyof Review,
      header: 'Efficiency',
      render: (value: number) => (
        <span className="font-medium">{value.toFixed(1)}%</span>
      ),
    },
    {
      key: 'final_work_score' as keyof Review,
      header: 'Score',
      render: (value: number) => (
        <div>
          <div className={`font-bold ${getScoreColor(value)}`}>
            {formatScore(value)}
          </div>
          <div className="text-sm text-gray-500">
            {getScoreCategory(value)}
          </div>
        </div>
      ),
    },
    {
      key: 'id' as keyof Review,
      header: 'Actions',
      render: (value: string, _row: Review) => (
        <button
          onClick={() => navigate(`/admin/reviews/${value}`)}
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          View Details
        </button>
      ),
    },
  ]

  const monthOptions = [
    { value: '', label: 'All Months' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-04', label: 'April 2026' },
  ]

  const employeeOptions = [
    { value: '', label: 'All Employees' },
    ...employees.map((e: any) => ({ value: e.id, label: e.full_name })),
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monthly Reviews</h1>
            <p className="text-gray-500">Manage employee performance reviews</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateReviews}
              disabled={generating}
              className="btn-primary flex items-center"
            >
              <FaPlus className="mr-2" />
              {generating ? 'Generating...' : 'Generate Reviews'}
            </button>
            <button className="btn-secondary flex items-center">
              <FaDownload className="mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <Select
                options={monthOptions}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                label="Month"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                options={employeeOptions}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                label="Employee"
              />
            </div>
            <div className="flex items-end">
              <span className="text-sm text-gray-500">
                {filteredReviews.length} reviews found
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-sm text-gray-500">Total Reviews</div>
            <div className="text-2xl font-bold">{filteredReviews.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Average Score</div>
            <div className="text-2xl font-bold text-primary-600">
              {filteredReviews.length > 0 
                ? (filteredReviews.reduce((a, r) => a + r.final_work_score, 0) / filteredReviews.length).toFixed(1)
                : '0.0'}
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Avg Efficiency</div>
            <div className="text-2xl font-bold text-green-600">
              {filteredReviews.length > 0
                ? (filteredReviews.reduce((a, r) => a + r.average_efficiency, 0) / filteredReviews.length).toFixed(1)
                : '0.0'}%
            </div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-500">Avg Completion</div>
            <div className="text-2xl font-bold text-blue-600">
              {filteredReviews.length > 0
                ? (filteredReviews.reduce((a, r) => a + r.completion_rate, 0) / filteredReviews.length).toFixed(1)
                : '0.0'}%
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={filteredReviews}
            columns={columns}
            onRowClick={(row) => navigate(`/admin/reviews/${row.id}`)}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default MonthlyReview