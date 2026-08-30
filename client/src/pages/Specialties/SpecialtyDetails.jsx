import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ClipboardList, Search, Stethoscope } from 'lucide-react'

import DoctorCard from '../../components/doctors/DoctorCard'
import Breadcrumbs from '../../components/common/Breadcrumbs'
import { DoctorCardSkeleton, EmptyState, ErrorState, LoadingState } from '../../components/common/States'
import { getSpecialtyIcon } from '../../components/specialties/specialtyIcons'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import specialtyService from '../../services/specialtyService'
import doctorService from '../../services/doctorService'
import { getErrorMessage } from '../../utils/helpers'

export default function SpecialtyDetails() {
  const { slug } = useParams()

  const [specialty, setSpecialty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [doctors, setDoctors] = useState([])
  const [doctorsLoading, setDoctorsLoading] = useState(true)
  const [doctorsError, setDoctorsError] = useState(null)

  useDocumentTitle(specialty?.name || 'Specialty')

  const loadSpecialty = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await specialtyService.get(slug)
      setSpecialty(data.specialty)
    } catch (err) {
      setError(getErrorMessage(err, 'This specialty could not be loaded.'))
      setSpecialty(null)
    } finally {
      setLoading(false)
    }
  }, [slug])

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true)
    setDoctorsError(null)
    try {
      const data = await doctorService.list({ specialty: slug, limit: 12, sort: 'rating' })
      setDoctors(data.doctors || [])
    } catch (err) {
      setDoctorsError(getErrorMessage(err, 'Doctors could not be loaded.'))
      setDoctors([])
    } finally {
      setDoctorsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    loadSpecialty()
    loadDoctors()
  }, [loadSpecialty, loadDoctors])

  if (loading) {
    return (
      <div className="container-app py-20">
        <LoadingState label="Loading specialty…" />
      </div>
    )
  }

  if (error || !specialty) {
    return (
      <div className="container-app py-16">
        <ErrorState
          title="Specialty not found"
          message={error || 'This specialty may no longer be available.'}
          onRetry={loadSpecialty}
        />
        <div className="mt-6 text-center">
          <Link to="/specialties" className="btn-outline">
            Browse all specialties
          </Link>
        </div>
      </div>
    )
  }

  const Icon = getSpecialtyIcon(specialty.icon || specialty.slug)
  const conditions = specialty.conditions || []

  return (
    <>
      {/* ---------- Specialty hero ---------- */}
      <section className="hero-gradient border-b border-ink-100">
        <div className="container-app py-8 lg:py-12">
          <Breadcrumbs
            items={[{ label: 'Specialties', to: '/specialties' }, { label: specialty.name }]}
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
              <Icon className="h-8 w-8" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">{specialty.name}</h1>
              {specialty.description && (
                <p className="mt-2 max-w-3xl leading-relaxed text-ink-600">{specialty.description}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/doctors?specialty=${specialty.slug}`} className="btn-primary">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  Find Doctors
                </Link>
                <Link to="/specialties" className="btn-outline">
                  All specialties
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-app py-8 lg:py-10">
        {/* ---------- Common conditions ---------- */}
        {conditions.length > 0 && (
          <section className="mb-10" aria-labelledby="conditions-heading">
            <h2
              id="conditions-heading"
              className="inline-flex items-center gap-2 text-xl font-bold sm:text-2xl"
            >
              <ClipboardList className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Conditions commonly treated
            </h2>
            <p className="mt-2 max-w-2xl text-ink-600">
              Doctors in {specialty.name} frequently support patients with the following concerns.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {conditions.map((c) => (
                <li key={c} className="rounded-full border border-ink-200 bg-surface-raised px-4 py-2 text-sm font-medium text-ink-700">
                  {c}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ---------- Doctors in this specialty ---------- */}
        <section aria-labelledby="specialty-doctors-heading">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="specialty-doctors-heading" className="text-xl font-bold sm:text-2xl">
                {specialty.name} doctors
              </h2>
              <p className="mt-1.5 text-ink-600">
                Verified clinicians accepting appointments in this specialty.
              </p>
            </div>
            <Link to={`/doctors?specialty=${specialty.slug}`} className="btn-outline shrink-0">
              See all
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {doctorsLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!doctorsLoading && doctorsError && (
            <ErrorState title="Could not load doctors" message={doctorsError} onRetry={loadDoctors} />
          )}

          {!doctorsLoading && !doctorsError && doctors.length === 0 && (
            <EmptyState
              icon={Stethoscope}
              title={`No ${specialty.name} doctors available yet`}
              message="Please check back soon, or browse our other specialties in the meantime."
              action={
                <Link to="/doctors" className="btn-primary btn-sm">
                  Browse all doctors
                </Link>
              }
            />
          )}

          {!doctorsLoading && !doctorsError && doctors.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
