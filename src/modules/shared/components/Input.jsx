import { useId } from 'react';

function Input({ label, error = '', className = '', id, ...restProps }) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const { 'aria-describedby': describedBy, ...inputProps } = restProps;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-semibold text-med-text-main"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? [describedBy, errorId].filter(Boolean).join(' ') : describedBy
        }
        className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-base text-med-text-main transition sm:text-sm ${error ? 'border-med-danger-text' : 'border-med-border'} ${className}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="text-sm text-med-danger-text">
          {error}
        </p>
      )}
    </div>
  );
}

export default Input;
