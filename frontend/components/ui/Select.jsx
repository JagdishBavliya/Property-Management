"use client"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { forwardRef } from 'react';

const Select = forwardRef(({
  options = [],
  value,
  onChange,
  placeholder = "Select option",
  disabled = false,
  required = false,
  className = "",
  name,
  ...props
}, ref) => {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          block w-full rounded-lg border-gray-300 shadow-sm border-2
          focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          appearance-none pr-10 p-3 
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
});


export default Select; 


