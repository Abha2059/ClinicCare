import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  Clock,
  HeartPulse,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from 'lucide-react'

import DoctorCard from '../../components/doctors/DoctorCard'
import ConditionCarousel from '../../components/home/ConditionCarousel'
import SpecialtyCard from '../../components/specialties/SpecialtyCard'
import Accordion from '../../components/common/Accordion'
import { DoctorCardSkeleton, EmptyState, ErrorState } from '../../components/common/States'
import { useApp } from '../../context/AppContext'
import useFetch from '../../hooks/useFetch'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import { HOME_FAQS } from '../../data/faqs'
import { POPULAR_CONDITIONS } from '../../utils/constants'
import HeroIllustration from './HeroIllustration'

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: 'Verified Doctors',
    text: 'Every profile in our directory is reviewed by the ClinicCare team before it goes live.',
  },
  {
    icon: CalendarCheck,
    title: 'Easy Booking',
    text: 'Pick a doctor, choose a free slot and confirm in a few steps — no phone queues.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Appointments',
    text: 'Your account and booking history are protected with encrypted authentication.',
  },
  {
    icon: HeartPulse,
    title: 'Patient Support',
    text: 'Manage, reschedule or cancel appointments any time from your personal dashboard.',
  },
]

const HOW_IT_WORKS = [
  { icon: Stethoscope, title: 'Select Specialty', text: 'Start with the area of care you need help with.' },
  { icon: UserRound, title: 'Choose Doctor', text: 'Compare experience, languages, ratings and fees.' },
  { icon: CalendarDays, title: 'Select Date & Time', text: 'Only genuinely free slots are shown to you.' },
  { icon: ClipboardList, title: 'Confirm Appointment', text: 'Add your reason for the visit and submit.' },
  { icon: CalendarCheck, title: 'Get Confirmation', text: 'Track everything from your dashboard.' },
]

const WHY_POINTS = [
  {
    title: 'Appointment scheduling without the back-and-forth',
    text: 'Availability comes straight from each doctor’s own working hours, so the times you see are the times you can actually take.',
  },
  {
    title: 'Doctor discovery that respects your filters',
    text: 'Narrow the directory by specialty, experience, consultation fee and rating until you find a genuine fit.',
  },
  {
    title: 'Transparent information up front',
    text: 'Qualifications, years of practice, languages spoken and consultation fees are visible before you book.',
  },
  {
    title: 'Secure patient accounts',
    text: 'Passwords are hashed, sessions are token-based, and your records stay visible only to you and your doctor.',
  },
  {
    title: 'One place to manage every visit',
    text: 'Upcoming, completed and cancelled appointments live together in a dashboard built for clarity.',
  },
]

export default function Home() {
  useDocumentTitle()
  const { specialties, specialtiesLoading } = useApp()

  const fetchFeatured = useCallback(() => doctorService.featured(6), [])
  const { data, loading, error, refetch } = useFetch(fetchFeatured, [])

  const doctors = data?.doctors || []
  const topSpecialties = specialties.slice(0, 15)

  return (
    <>
      {/* ---------- SECTION 1 — HERO ---------- */}
      <section className="hero-gradient hero-full relative isolate flex items-center overflow-hidden border-b border-ink-100">
        {/* Moving backdrop. Decorative only — the scrim above it is what keeps
            the headline legible, so the footage never carries meaning.
            The poster image is what renders until the clip is buffered, and is
            all that shows for anyone who has asked for reduced motion. */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <video
            className="hero-video h-full w-full object-cover object-[85%_center]"
            poster="/hero/clinic-hero.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/hero/clinic-hero.mp4" type="video/mp4" />
          </video>
          <img
            src="/hero/clinic-hero.jpg"
            alt=""
            className="hero-video-fallback absolute inset-0 h-full w-full object-cover object-[85%_center]"
          />
          <div className="hero-scrim absolute inset-0" />
        </div>

        <div className="container-app grid w-full items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="hero-copy animate-fade-up">
            <span className="badge-brand">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              Better Care. Better Health.
            </span>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
              Find the Right Doctor for Your Care
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">
              Connect with trusted healthcare professionals and book appointments at a time that
              works for you.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/doctors" className="btn-primary btn-lg">
                <Search className="h-5 w-5" aria-hidden="true" />
                Find a Doctor
              </Link>
              <Link to="/specialties" className="btn-outline btn-lg">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
                Book Appointment
              </Link>
            </div>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-4 border-t border-ink-200 pt-6">
              <div>
                <dt className="text-xs font-medium text-ink-500">Specialties</dt>
                <dd className="mt-0.5 text-xl font-bold text-ink-900 sm:text-2xl">
                  {specialtiesLoading ? '—' : `${specialties.length || 17}+`}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-500">Booking steps</dt>
                <dd className="mt-0.5 text-xl font-bold text-ink-900 sm:text-2xl">5</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-500">Availability</dt>
                <dd className="mt-0.5 text-xl font-bold text-ink-900 sm:text-2xl">24/7</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden lg:block">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ---------- SECTION 2 — TRUST ---------- */}
      <section className="section" aria-labelledby="trust-heading">
        <div className="container-app">
          <h2 id="trust-heading" className="sr-only">
            Why patients trust ClinicCare
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="card card-body">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <item.icon className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SECTION 3 — SPECIALTIES ---------- */}
      <section className="section bg-ink-50/60" aria-labelledby="specialties-heading">
        <div className="container-app">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="specialties-heading" className="text-2xl font-bold sm:text-3xl">
                Care across every specialty
              </h2>
              <p className="mt-2 max-w-2xl text-ink-600">
                From everyday health concerns to focused, long-term care — choose the area you need.
              </p>
            </div>
            <Link to="/specialties" className="btn-outline shrink-0">
              View All Specialties
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {specialtiesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" aria-hidden="true" />
              ))}
            </div>
          ) : topSpecialties.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topSpecialties.map((s) => (
                <SpecialtyCard key={s._id || s.slug} specialty={s} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Stethoscope}
              title="Specialties are not available right now"
              message="Start the ClinicCare API and seed the database to see the full list of specialties."
            />
          )}
        </div>
      </section>

      {/* ---------- SECTION 4 — POPULAR CONDITIONS ---------- */}
      <section className="section" aria-labelledby="conditions-heading">
        <div className="container-app">
          <h2 id="conditions-heading" className="text-2xl font-bold sm:text-3xl">
            Popular health concerns
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            Not sure which specialty fits? Start from a common concern and we will point you to the
            right doctors.
          </p>

          <div className="mt-7">
            <ConditionCarousel items={POPULAR_CONDITIONS} />
          </div>
        </div>
      </section>

      {/* ---------- SECTION 5 — FEATURED DOCTORS ---------- */}
      <section className="section bg-ink-50/60" aria-labelledby="doctors-heading">
        <div className="container-app">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="doctors-heading" className="text-2xl font-bold sm:text-3xl">
                Top-rated doctors
              </h2>
              <p className="mt-2 max-w-2xl text-ink-600">
                Experienced clinicians with consistently strong patient feedback.
              </p>
            </div>
            <Link to="/doctors" className="btn-outline shrink-0">
              Browse all doctors
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          {loading && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <DoctorCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState
              title="Could not load doctors"
              message="The ClinicCare API is not reachable. Start the server and try again."
              onRetry={refetch}
            />
          )}

          {!loading && !error && doctors.length === 0 && (
            <EmptyState
              icon={Stethoscope}
              title="No doctors published yet"
              message="Run the seed script on the server to populate the ClinicCare directory."
            />
          )}

          {!loading && !error && doctors.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor._id} doctor={doctor} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- SECTION 6 — HOW IT WORKS ---------- */}
      <section className="section" aria-labelledby="how-heading">
        <div className="container-app">
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="how-heading" className="text-2xl font-bold sm:text-3xl">
              Booking care in five simple steps
            </h2>
            <p className="mt-2 text-ink-600">
              A clear path from choosing a specialty to holding a confirmed appointment.
            </p>
          </div>

          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="card card-body relative">
                <span className="absolute right-4 top-4 font-display text-3xl font-bold text-ink-100">
                  {i + 1}
                </span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- SECTION 7 — WHY CLINICCARE ---------- */}
      <section className="section bg-ink-900 text-white" aria-labelledby="why-heading">
        <div className="container-app grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 id="why-heading" className="text-2xl font-bold text-white sm:text-3xl">
              Why patients choose ClinicCare
            </h2>
            <p className="mt-3 max-w-lg leading-relaxed text-ink-300">
              We focus on the parts of healthcare admin that usually get in the way: finding the
              right clinician, seeing honest information, and holding on to a slot that is really
              free.
            </p>
            <Link to="/register" className="btn-primary btn-lg mt-7">
              Create your free account
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>

          <ul className="space-y-4">
            {WHY_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5 rounded-2xl bg-ink-800/60 p-4">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-400">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- SECTION 8 — FAQ ---------- */}
      <section className="section" aria-labelledby="faq-heading">
        <div className="container-app max-w-4xl">
          <div className="mb-8 text-center">
            <h2 id="faq-heading" className="text-2xl font-bold sm:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-ink-600">
              Everything you need to know before your first ClinicCare appointment.
            </p>
          </div>

          <Accordion items={HOME_FAQS} />

          <p className="mt-6 text-center text-sm text-ink-600">
            Still have a question?{' '}
            <Link to="/faq" className="link">
              Read the full FAQ
            </Link>{' '}
            or{' '}
            <Link to="/contact" className="link">
              contact our team
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ---------- SECTION 9 — CTA ---------- */}
      <section className="section pt-0" aria-labelledby="cta-heading">
        <div className="container-app">
          <div className="hero-gradient overflow-hidden rounded-3xl border border-brand-100 px-6 py-12 text-center sm:px-12 lg:py-16">
            <h2 id="cta-heading" className="text-2xl font-bold sm:text-3xl lg:text-4xl">
              Your Health Deserves Convenient Care
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-600">
              Browse trusted doctors across every specialty and secure an appointment that fits your
              schedule.
            </p>
            <Link to="/doctors" className="btn-primary btn-lg mt-7">
              <Search className="h-5 w-5" aria-hidden="true" />
              Find a Doctor
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
