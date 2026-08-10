import { useMemo, useState } from 'react'
import { Search, Stethoscope, X } from 'lucide-react'

import SpecialtyCard from '../../components/specialties/SpecialtyCard'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { EmptyState, ErrorState } from '../../components/common/States'
import { useApp } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function Specialties() {
  useDocumentTitle('Specialties')
  const { specialties, specialtiesLoading, specialtiesError, reloadSpecialties } = useApp()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return specialties
    return specialties.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        (s.conditions || []).some((c) => c.toLowerCase().includes(q)),
    )
  }, [specialties, query])

  return (
    <div className="container-app py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Specialties' }]} />

      <header className="mb-7 max-w-3xl">
        <h1 className="text-2xl font-bold sm:text-3xl">Browse healthcare specialties</h1>
        <p className="mt-2 text-ink-600">
          Choose the area of care you need and we will show you the doctors who practise in it,
          along with the conditions they commonly treat.
        </p>
      </header>

      <div className="relative mb-7 max-w-lg">
        <label htmlFor="specialty-search" className="sr-only">
          Search specialties
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          id="specialty-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a specialty or condition…"
          className="input h-12 pl-11"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {specialtiesLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" aria-hidden="true" />
          ))}
        </div>
      )}

      {!specialtiesLoading && specialtiesError && (
        <ErrorState
          title="Could not load specialties"
          message="The ClinicCare API is not reachable right now."
          onRetry={reloadSpecialties}
        />
      )}

      {!specialtiesLoading && !specialtiesError && filtered.length === 0 && (
        <EmptyState
          icon={Stethoscope}
          title={query ? 'No specialties match your search' : 'No specialties available'}
          message={
            query
              ? 'Try a different term, or browse the full list.'
              : 'Seed the ClinicCare database to populate specialties.'
          }
          action={
            query ? (
              <button type="button" onClick={() => setQuery('')} className="btn-primary btn-sm">
                Show all specialties
              </button>
            ) : null
          }
        />
      )}

      {!specialtiesLoading && !specialtiesError && filtered.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-600" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'specialty' : 'specialties'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <SpecialtyCard key={s._id || s.slug} specialty={s} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
