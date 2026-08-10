import { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils/helpers'

/**
 * Label + control + error message, wired for accessibility.
 * Designed to take a react-hook-form `register()` spread directly.
 */
function FieldShell({ id, label, error, hint, required, children, className }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      {error && (
        <p className="helper-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input(
  { label, error, hint, required, icon: Icon, className, wrapperClassName, id, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId
  const errorId = `${fieldId}-error`

  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn('input', Icon && 'pl-10', error && 'input-error', className)}
          {...rest}
        />
      </div>
      {error && <span id={errorId} className="sr-only" />}
    </FieldShell>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className, wrapperClassName, id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? 'true' : undefined}
        className={cn('input resize-y', error && 'input-error', className)}
        {...rest}
      />
    </FieldShell>
  )
})

export const Select = forwardRef(function Select(
  { label, error, hint, required, options = [], placeholder, className, wrapperClassName, id, children, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={wrapperClassName}
    >
      <select
        ref={ref}
        id={fieldId}
        aria-invalid={error ? 'true' : undefined}
        className={cn('select', error && 'input-error', className)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children ||
          options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
      </select>
    </FieldShell>
  )
})

export const Checkbox = forwardRef(function Checkbox({ label, error, id, className, ...rest }, ref) {
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-start gap-2.5">
        <input ref={ref} id={fieldId} type="checkbox" className="checkbox mt-0.5" {...rest} />
        <label htmlFor={fieldId} className="text-sm text-ink-700">
          {label}
        </label>
      </div>
      {error && (
        <p className="helper-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
})

export default Input
