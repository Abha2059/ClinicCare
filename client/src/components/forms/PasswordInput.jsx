import { forwardRef, useId, useState } from 'react'
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react'
import { cn } from '../../utils/helpers'

/** Password field with an accessible show/hide toggle. */
const PasswordInput = forwardRef(function PasswordInput(
  { label = 'Password', error, hint, required, id, className, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false)
  const autoId = useId()
  const fieldId = id || autoId

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          className={cn('input pl-10 pr-11', error && 'input-error', className)}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      {error && (
        <p className="helper-error" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
})

export default PasswordInput
