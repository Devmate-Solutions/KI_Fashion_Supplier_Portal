import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

// Custom input component that integrates with react-hook-form
const CustomInput = forwardRef(({ value, onClick, onChange, placeholder, className, error, ...props }, ref) => (
  <div className="relative">
    <input
      ref={ref}
      type="text"
      value={value}
      onClick={onClick}
      onChange={onChange}
      placeholder={placeholder}
      className={`${className} pr-10`}
      readOnly
      {...props}
    />
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-app-accent focus:outline-none focus:text-app-accent transition-colors"
      aria-label="Open calendar"
    >
      <Calendar className="h-4 w-4" />
    </button>
  </div>
));

CustomInput.displayName = 'CustomInput';

const BritishDatePicker = forwardRef(({
  value,
  onChange,
  className = '',
  error = false,
  maxDate = new Date(),
  minDate = null,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  ...props
}, ref) => {
  // Convert string to Date object if needed
  const selectedDate = value ? (typeof value === 'string' ? new Date(value) : value) : null;

  return (
    <DatePicker
      ref={ref}
      selected={selectedDate}
      onChange={onChange}
      dateFormat="dd/MM/yyyy"
      maxDate={maxDate}
      minDate={minDate}
      placeholderText={placeholder}
      disabled={disabled}
      showYearDropdown
      showMonthDropdown
      dropdownMode="select"
      customInput={
        <CustomInput
          className={className}
          error={error}
        />
      }
      {...props}
    />
  );
});

BritishDatePicker.displayName = 'BritishDatePicker';

export default BritishDatePicker;