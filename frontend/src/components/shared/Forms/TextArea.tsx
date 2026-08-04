import React, { forwardRef } from 'react'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helper?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, helper, className = '', rows = 4, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={`input-field ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helper && <p className="mt-1 text-sm text-gray-500">{helper}</p>}
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea