import { Check } from 'lucide-react'
import { cn } from '../../utils/helpers'

/**
 * Horizontal progress indicator for the multi-step booking flow.
 * Completed steps are clickable so a patient can go back and change an answer.
 */
export default function Stepper({ steps = [], current = 0, onStepClick, className }) {
  return (
    <nav aria-label="Booking progress" className={cn('w-full', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isComplete = index < current
          const isCurrent = index === current
          const clickable = isComplete && typeof onStepClick === 'function'

          return (
            <li
              key={step.label ?? index}
              className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}
            >
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={clickable ? () => onStepClick(index) : undefined}
                  disabled={!clickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${index + 1}: ${step.label}${isComplete ? ' (completed)' : ''}`}
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition',
                    isComplete && 'border-brand-600 bg-brand-600 text-white',
                    isCurrent && 'border-brand-600 bg-surface-raised text-brand-700 ring-4 ring-brand-100',
                    !isComplete && !isCurrent && 'border-ink-200 bg-surface-raised text-ink-400',
                    clickable && 'cursor-pointer hover:brightness-110',
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
                </button>
                <span
                  className={cn(
                    'hidden max-w-[7rem] text-center text-[11px] font-medium leading-tight sm:block',
                    isCurrent ? 'text-brand-700' : 'text-ink-500',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-2 h-0.5 flex-1 rounded-full transition sm:mx-3',
                    index < current ? 'bg-brand-600' : 'bg-ink-200',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Compact label for small screens */}
      <p className="mt-3 text-center text-sm font-medium text-brand-700 sm:hidden">
        Step {current + 1} of {steps.length}: {steps[current]?.label}
      </p>
    </nav>
  )
}
