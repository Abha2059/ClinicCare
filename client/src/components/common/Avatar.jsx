import { useState } from 'react'
import { avatarColor, cn, getInitials } from '../../utils/helpers'

const SIZES = {
  xs: 'h-8 w-8 text-xs rounded-lg',
  sm: 'h-10 w-10 text-sm rounded-xl',
  md: 'h-14 w-14 text-base rounded-2xl',
  lg: 'h-20 w-20 text-xl rounded-2xl',
  xl: 'h-28 w-28 text-3xl rounded-3xl',
}

/**
 * Avatar with a deterministic initials fallback.
 * Falls back automatically when the image fails to load.
 */
export default function Avatar({ src, name = '', size = 'md', className, ring = false }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return showImage ? (
    <img
      src={src}
      alt={name ? `${name}` : 'Profile photo'}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn(
        'shrink-0 object-cover',
        SIZES[size],
        ring && 'ring-2 ring-white',
        className,
      )}
    />
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold',
        SIZES[size],
        avatarColor(name),
        ring && 'ring-2 ring-white',
        className,
      )}
    >
      {getInitials(name) || '?'}
    </span>
  )
}
