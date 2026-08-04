import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input