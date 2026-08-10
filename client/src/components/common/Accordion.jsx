import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/helpers'

/** items: [{ question, answer }] — accessible disclosure list used for FAQs. */
export default function Accordion({ items = [], allowMultiple = false, className }) {
  const [open, setOpen] = useState(() => new Set())
  const baseId = useId()

  const toggle = (index) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className={cn('divide-y divide-ink-100 overflow-hidden rounded-2xl border border-ink-100 bg-white', className)}>
      {items.map((item, i) => {
        const isOpen = open.has(i)
        const btnId = `${baseId}-btn-${i}`
        const panelId = `${baseId}-panel-${i}`
        return (
          <div key={item.question ?? i}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-ink-50/60 sm:px-6"
              >
                <span className="text-sm font-semibold text-ink-900 sm:text-base">{item.question}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200',
                    isOpen && 'rotate-180 text-brand-600',
                  )}
                  aria-hidden="true"
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-5 pb-5 text-sm leading-relaxed text-ink-600 sm:px-6"
            >
              {item.answer}
            </div>
          </div>
        )
      })}
    </div>
  )
}
