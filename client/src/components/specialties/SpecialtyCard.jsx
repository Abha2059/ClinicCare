import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getSpecialtyIcon } from './specialtyIcons'
import { cn } from '../../utils/helpers'

/** Specialty tile used on the homepage grid and the specialties directory. */
export default function SpecialtyCard({ specialty, compact = false, className }) {
  if (!specialty) return null
  const Icon = getSpecialtyIcon(specialty.icon || specialty.slug)

  return (
    <Link
      to={`/specialties/${specialty.slug}`}
      className={cn(
        'card-hover group flex w-full items-center gap-3 overflow-hidden p-3.5 sm:gap-4 sm:p-5',
        compact && 'p-3 sm:p-4',
        className,
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white sm:h-12 sm:w-12">
        <Icon className="h-5.5 w-5.5 sm:h-6 sm:w-6" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1 overflow-hidden">
        <span className="block truncate font-semibold text-ink-900">{specialty.name}</span>
        {!compact && specialty.description && (
          <span className="mt-0.5 line-clamp-1 block text-xs text-ink-500">
            {specialty.description}
          </span>
        )}
        {typeof specialty.doctorCount === 'number' && (
          <span className="mt-1 block text-xs font-medium text-brand-700">
            {specialty.doctorCount} {specialty.doctorCount === 1 ? 'doctor' : 'doctors'}
          </span>
        )}
      </span>

      <ArrowRight
        className="h-4 w-4 shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden="true"
      />
    </Link>
  )
}
