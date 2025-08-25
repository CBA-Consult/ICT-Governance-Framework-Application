import React from 'react';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  helpText,
  placeholder
}) => {
  return (
    <div className="form-group space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`transition-colors ${
          error 
            ? 'border-red-500 focus-visible:ring-red-500' 
            : 'border-gray-300 focus-visible:ring-blue-500'
        }`}
        aria-describedby={error ? `${name}-error` : helpText ? `${name}-help` : undefined}
      />
      
      {error && (
        <p id={`${name}-error`} className="text-red-500 text-sm">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p id={`${name}-help`} className="text-gray-500 text-sm">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default FormField;