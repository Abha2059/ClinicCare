import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Stethoscope, X } from 'lucide-react'

import DoctorCard from '../../components/doctors/DoctorCard'
import DoctorFilters from '../../components/doctors/DoctorFilters'
import Pagination from '../../components/common/Pagination'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { DoctorCardSkeleton, EmptyState, ErrorState } from '../../components/common/States'
import { useApp } from '../../context/AppContext'
import useDebounce from '../../hooks/useDebounce'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import { PAGE_SIZE } from '../../utils/constants'
import { getErrorMessage } from '../../utils/helpers'

const DEFAULT_FILTERS = {
  specialty: '',
  minExperience: '',
  minRating: '',
  maxFee: '',
  sort: 'rating',
  availableOnly: false,
}

export default function Doctors() {
  useDocumentTitle('Find Doctors')
  const { specialties } = useApp()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL is the source of truth so results stay shareable and survive refresh.
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    specialty: searchParams.get('specialty') || '',
    minExperience: searchParams.get('minExperience') || '',
    minRating: searchParams.get('minRating') || '',
    maxFee: searchParams.get('maxFee') || '',
    sort: searchParams.get('sort') || 'rating',
    availableOnly: searchParams.get('availableOnly') === 'true',
  }))
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1)
  const [showFilters, setShowFilters] = useState(false)

  const [result, setResult] = useState({ doctors: [], total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 450)

  // Keep the address bar in sync with the active query.
  useEffect(() => {
    const next = new URLSearchParams()
    if (debouncedSearch) next.set('search', debouncedSearch)
    if (filters.specialty) next.set('specialty', filters.specialty)
    if (filters.minExperience) next.set('minExperience', filters.minExperience)
    if (filters.minRating) next.set('minRating', filters.minRating)
    if (filters.maxFee) next.set('maxFee', filters.maxFee)
    if (filters.sort && filters.sort !== 'rating') next.set('sort', filters.sort)
    if (filters.availableOnly) next.set('availableOnly', 'true')
    if (page > 1) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, filters, page, setSearchParams])

  // Any filter change returns to the first page.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, filters])

  const fetchDoctors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sort: filters.sort,
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.specialty) params.specialty = filters.specialty
      if (filters.minExperience) params.minExperience = filters.minExperience
      if (filters.minRating) params.minRating = filters.minRating
      if (filters.maxFee && Number(filters.maxFee) < 3000) params.maxFee = filters.maxFee
      if (filters.availableOnly) params.availableOnly = 'true'

      const data = await doctorService.list(params)
      setResult({
        doctors: data.doctors || [],
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'We could not load the doctor directory.'))
      setResult({ doctors: [], total: 0, totalPages: 0 })
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filters])

  useEffect(() => {
    fetchDoctors()
  }, [fetchDoctors])

  const activeCount = useMemo(() => {
    let n = 0
    if (filters.specialty) n += 1
    if (filters.minExperience) n += 1
    if (filters.minRating) n += 1
    if (filters.maxFee && Number(filters.maxFee) < 3000) n += 1
    if (filters.availableOnly) n += 1
    return n
  }, [filters])

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS)
    setSearch('')
  }

  const { doctors, total, totalPages } = result

  return (
    <div className="container-app py-8 lg:py-10">
      <Breadcrumbs items={[{ label: 'Find Doctors' }]} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">Find the right doctor</h1>
        <p className="mt-2 max-w-2xl text-ink-600">
          Search our directory of verified clinicians and filter by specialty, experience, fee and
          patient rating.
        </p>
      </header>

      {/* Search bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="doctor-search" className="sr-only">
            Search doctors by name or specialty
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <input
            id="doctor-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialty or expertise…"
            className="input h-12 pl-11"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-400 transition hover:bg-ink-50 hover:text-ink-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="btn-outline h-12 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filters
          {activeCount > 0 && <span className="badge-brand">{activeCount}</span>}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Filters — always visible on desktop, collapsible on mobile */}
        <aside className={showFilters ? 'block' : 'hidden lg:block'}>
          <div className="lg:sticky lg:top-24">
            <DoctorFilters
              filters={filters}
              specialties={specialties}
              onChange={setFilters}
              onReset={resetFilters}
              activeCount={activeCount}
            />
          </div>
        </aside>

        <section aria-label="Doctor results">
          {/* Result meta */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-600" aria-live="polite">
              {loading
                ? 'Searching…'
                : total > 0
                  ? `${total} doctor${total === 1 ? '' : 's'} found`
                  : 'No doctors found'}
            </p>
            {activeCount > 0 && !loading && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Clear filters
              </button>
            )}
          </div>

          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState
              title="Could not load doctors"
              message={error}
              onRetry={fetchDoctors}
            />
          )}

          {!loading && !error && doctors.length === 0 && (
            <EmptyState
              icon={Stethoscope}
              title="No doctors match your search"
              message="Try removing a filter or searching for a different specialty."
              action={
                activeCount > 0 || search ? (
                  <button type="button" onClick={resetFilters} className="btn-primary btn-sm">
                    Reset search
                  </button>
                ) : null
              }
            />
          )}

          {!loading && !error && doctors.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {doctors.map((doctor) => (
                  <DoctorCard key={doctor._id} doctor={doctor} />
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => {
                  setPage(p)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="mt-10"
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
