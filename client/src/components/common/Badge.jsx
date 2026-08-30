import { PAYMENT_STATUS_META, STATUS_META } from '../../utils/constants'
import { cn } from '../../utils/helpers'

const VARIANTS = {
  brand: 'badge-brand',
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
}

export default function Badge({ variant = 'neutral', icon: Icon, className, children }) {
  return (
    <span className={cn(VARIANTS[variant] || VARIANTS.neutral, className)}>
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Appointment status pill — single source of truth for status colours. */
export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || { label: status || 'Unknown', className: 'badge-neutral' }
  return <span className={cn(meta.className, className)}>{meta.label}</span>
}

/** Payment state pill — paid online, due at the clinic, or refunded. */
export function PaymentBadge({ status, className }) {
  const meta = PAYMENT_STATUS_META[status] || PAYMENT_STATUS_META.pending
  return <span className={cn(meta.className, className)}>{meta.label}</span>
}
