/**
 * Mobile Optimized Input Component
 * Provides touch-friendly input fields with proper spacing for mobile devices
 * Minimum touch target: 44x44 pixels as per WCAG guidelines
 */

import { forwardRef } from 'react'

export const MobileOptimizedInput = forwardRef(
  (
    {
      label,
      error,
      required,
      type = 'text',
      placeholder,
      disabled = false,
      help,
      className = '',
      inputClassName = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full mb-4 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            min-h-12
            px-4
            py-3
            text-base
            border border-gray-300
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-orange-500
            focus:border-transparent
            disabled:bg-gray-100
            disabled:cursor-not-allowed
            transition-colors
            ${error ? 'border-red-500' : ''}
            ${inputClassName}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {help && !error && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    )
  }
)

MobileOptimizedInput.displayName = 'MobileOptimizedInput'

export const MobileOptimizedSelect = forwardRef(
  (
    {
      label,
      error,
      required,
      options = [],
      disabled = false,
      help,
      className = '',
      selectClassName = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full mb-4 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={`
            w-full
            min-h-12
            px-4
            py-3
            text-base
            border border-gray-300
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-orange-500
            focus:border-transparent
            disabled:bg-gray-100
            disabled:cursor-not-allowed
            transition-colors
            appearance-none
            cursor-pointer
            bg-white
            ${error ? 'border-red-500' : ''}
            ${selectClassName}
          `}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {help && !error && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    )
  }
)

MobileOptimizedSelect.displayName = 'MobileOptimizedSelect'

export const MobileOptimizedTextarea = forwardRef(
  (
    {
      label,
      error,
      required,
      placeholder,
      disabled = false,
      rows = 4,
      help,
      className = '',
      textareaClassName = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className={`w-full mb-4 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`
            w-full
            min-h-32
            px-4
            py-3
            text-base
            border border-gray-300
            rounded-lg
            focus:outline-none
            focus:ring-2
            focus:ring-orange-500
            focus:border-transparent
            disabled:bg-gray-100
            disabled:cursor-not-allowed
            transition-colors
            resize-none
            ${error ? 'border-red-500' : ''}
            ${textareaClassName}
          `}
          {...props}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        {help && !error && <p className="text-sm text-gray-500 mt-1">{help}</p>}
      </div>
    )
  }
)

MobileOptimizedTextarea.displayName = 'MobileOptimizedTextarea'

/**
 * Mobile Optimized Button
 * Touch-friendly button with minimum 44x44 tap target
 */
export const MobileOptimizedButton = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      font-medium
      rounded-lg
      transition-all
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-offset-2
      disabled:opacity-50
      disabled:cursor-not-allowed
      flex
      items-center
      justify-center
      gap-2
      whitespace-nowrap
    `

    const variantClasses = {
      primary: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    }

    const sizeClasses = {
      sm: 'min-h-10 px-3 text-sm',
      md: 'min-h-12 px-4 text-base',
      lg: 'min-h-14 px-6 text-lg',
    }

    const widthClass = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${widthClass}
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

MobileOptimizedButton.displayName = 'MobileOptimizedButton'
