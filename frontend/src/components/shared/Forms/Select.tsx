import React, { forwardRef } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  helper?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helper, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select