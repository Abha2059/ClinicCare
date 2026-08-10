import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/helpers'

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
}

/**
 * Single button primitive used across the app.
 * Renders as <button>, <Link> (`to`) or <a> (`href`) while keeping identical styling.
 */
export default function Button({
  as,
  to,
  href,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...rest
}) {
  const classes = cn(
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )

  const content = (
    <>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className={cn('h-4 w-4', size === 'lg' && 'h-5 w-5')} aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight className={cn('h-4 w-4', size === 'lg' && 'h-5 w-5')} aria-hidden="true" />
      )}
    </>
  )

  if (to && !disabled && !loading) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    )
  }

  if (href && !disabled && !loading) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    )
  }

  const Tag = as || 'button'
  return (
    <Tag
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </Tag>
  )
}
