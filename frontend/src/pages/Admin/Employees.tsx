import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/common/Layout/AdminLayout'
import DataTable from '../../components/shared/Tables/DataTable'
import Input from '../../components/shared/Forms/Input'
import Select from '../../components/shared/Forms/Select'
import Spinner from '../../components/common/Loading/Spinner'
import { usersApi } from '../../api/users'
import { User } from '../../types/user'
import { USER_ROLES } from '../../utils/constants'
import { formatDate } from '../../utils/formatters'
import { FaPlus, FaSearch, FaUpload } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Employees: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<User[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    filterEmployees()
  }, [employees, searchTerm, roleFilter])

  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const data = await usersApi.getAll()
      setEmployees(data)
      setFilteredEmployees(data)
    } catch (error) {
      toast.error('Failed to fetch employees')
    } finally {
      setLoading(false)
    }
  }

  const filterEmployees = () => {
    let filtered = [...employees]

    if (searchTerm) {
      filtered = filtered.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter) {
      filtered = filtered.filter((emp) => emp.role === roleFilter)
    }

    setFilteredEmployees(filtered)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        await usersApi.delete(id)
        toast.success('Employee deactivated successfully')
        fetchEmployees()
      } catch (error) {
        toast.error('Failed to deactivate employee')
      }
    }
  }

  const handleActivate = async (id: string) => {
    try {
      await usersApi.activate(id)
      toast.success('Employee activated successfully')
      fetchEmployees()
    } catch (error) {
      toast.error('Failed to activate employee')
    }
  }

  const columns = [
    {
      key: 'full_name',
      header: 'Name',
      render: (value: string, row: User) => (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-500/15 text-primary-300 flex items-center justify-center font-medium text-sm">
            {value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="ml-3">
            <div className="font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'employee_id',
      header: 'Employee ID',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'department',
      header: 'Department',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string) => (
        <span className={`badge ${
          value === 'admin' ? 'bg-danger/15 text-red-400' :
          value === 'manager' ? 'bg-primary-500/15 text-primary-300' :
          'bg-success/15 text-green-400'
        }`}>
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value: boolean) => (
        <span className={`badge ${
          value ? 'bg-success/15 text-green-400' : 'bg-danger/15 text-red-400'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'date_joined',
      header: 'Joined',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'id',
      header: 'Actions',
      render: (value: string, row: User) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/employees/${value}`)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/admin/employees/${value}/edit`)}
            className="text-primary-400 hover:text-primary-300 text-sm"
          >
            Edit
          </button>
          {row.is_active ? (
            <button
              onClick={() => handleDelete(value)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={() => handleActivate(value)}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              Activate
            </button>
          )}
        </div>
      ),
    },
  ]

  const roleOptions = [
    { value: '', label: 'All Roles' },
    ...USER_ROLES.map(role => ({ value: role.value, label: role.label })),
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
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-gray-500">Manage your organization's employees</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/admin/employees/bulk-import')}
              className="btn-secondary flex items-center"
            >
              <FaUpload className="mr-2" />
              Import
            </button>
            <button
              onClick={() => navigate('/admin/employees/new')}
              className="btn-primary flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<FaSearch />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={roleOptions}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500">
                {filteredEmployees.length} employees found
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card">
          <DataTable
            data={filteredEmployees}
            columns={columns}
            onRowClick={(row) => navigate(`/admin/employees/${row.id}`)}
          />
        </div>
      </div>
    </AdminLayout>
  )
}

export default Employees
