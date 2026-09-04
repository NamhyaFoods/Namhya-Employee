import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FaTrash } from 'react-icons/fa'
import { Task } from '../../../types/task'
import { formatDate, getStatusColor, getPriorityColor } from '../../../utils/formatters'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  // Optional - only pass this where deleting makes sense (admin views).
  // Left undefined, no delete icon renders at all, so this stays out of
  // the employee's own task list without needing a role check here.
  onDelete?: () => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDelete }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate(`/employee/tasks/${task.id}`)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    // Stop the card's own onClick (navigation) from also firing.
    e.stopPropagation()
    onDelete?.()
  }

  return (
    <div
      onClick={handleClick}
      className="card cursor-pointer hover:shadow-md transition-shadow relative"
    >
      {onDelete && (
        <button
          onClick={handleDeleteClick}
          title="Delete task"
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 p-1"
        >
          <FaTrash size={14} />
        </button>
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate pr-6">{task.title}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {task.description || 'No description'}
          </p>
        </div>
        <div className="flex flex-col items-end space-y-1 ml-4">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(task.status)} text-white`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-gray-500">Progress:</span>
            <span className="ml-1 font-medium">{task.progress_percentage}%</span>
          </div>
          <div>
            <span className="text-gray-500">Hours:</span>
            <span className="ml-1 font-medium">
              {task.actual_hours}/{task.allocated_hours}h
            </span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {task.due_date ? `Due: ${formatDate(task.due_date)}` : 'No due date'}
        </div>
      </div>

      {task.progress_percentage > 0 && (
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${task.progress_percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  )
}

export default TaskCard
