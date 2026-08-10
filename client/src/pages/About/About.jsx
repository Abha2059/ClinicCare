import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarCheck,
  HeartPulse,
  Lock,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react'

import Breadcrumbs from '../../components/common/Breadcrumbs'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { BRAND } from '../../utils/constants'

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Trust before scale',
    text: 'Every doctor profile is reviewed before it appears in the directory, and verified profiles are clearly marked.',
  },
  {
    icon: CalendarCheck,
    title: 'Availability you can rely on',
    text: 'Slots are validated on our servers at the moment of booking, so a confirmed time is genuinely yours.',
  },
  {
    icon: Lock,
    title: 'Privacy by default',
    text: 'Appointment records are visible only to the patient, the treating doctor and platform administrators.',
  },
  {
    icon: Users,
    title: 'Built for everyone',
    text: 'Keyboard navigation, screen-reader labels and readable contrast are part of the product, not an afterthought.',
  },
]

const PRINCIPLES = [
  {
    title: 'Clear information',
    text: 'Qualifications, years of practice, languages and consultation fees appear before you commit to a booking — never after.',
  },
  {
    title: 'No dead ends',
    text: 'Every page has a considered loading, empty and error state, so you always know what is happening and what to do next.',
  },
  {
    title: 'Care, not claims',
    text: 'ClinicCare helps you reach a qualified clinician. We do not diagnose, prescribe or offer medical advice ourselves.',
  },
]

export default function About() {
  useDocumentTitle('About')

  return (
    <>
      <section className="hero-gradient border-b border-ink-100">
        <div className="container-app py-10 lg:py-14">
          <Breadcrumbs items={[{ label: 'About' }]} />
          <div className="max-w-3xl">
            <span className="badge-brand">
              <HeartPulse className="h-3.5 w-3.5" aria-hidden="true" />
              {BRAND.tagline}
            </span>
            <h1 className="mt-4 text-3xl font-bold sm:text-4xl">
              Healthcare appointments, without the friction
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              {BRAND.name} exists to remove the admin that sits between a patient and the right
              clinician: unclear availability, opaque fees and phone calls that go nowhere.
            </p>
          </div>
        </div>
      </section>

      <div className="container-app section">
        <section aria-labelledby="mission-heading" className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 id="mission-heading" className="text-2xl font-bold sm:text-3xl">
              What we do
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-ink-600">
              <p>
                {BRAND.name} is a healthcare appointment platform. Patients can search a directory of
                doctors by specialty, experience, consultation fee and patient rating, view a full
                profile, and book a time that suits them.
              </p>
              <p>
                Doctors manage their own consulting hours and unavailable dates, so the slots patients
                see reflect real working patterns rather than a generic calendar. When a booking is
                submitted, our server re-checks the slot before writing the record — two patients can
                never hold the same time with the same doctor.
              </p>
              <p>
                Administrators oversee the platform: verifying doctor profiles, managing specialties
                and keeping an eye on appointment activity across the service.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.title} className="card card-body">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <value.icon className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{value.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{value.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="principles-heading" className="mt-16">
          <h2 id="principles-heading" className="text-2xl font-bold sm:text-3xl">
            How we build
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border-l-4 border-brand-500 bg-ink-50/60 p-5">
                <h3 className="font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="disclaimer-heading"
          className="mt-16 rounded-2xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 id="disclaimer-heading" className="text-lg font-semibold text-amber-900">
            An important note
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
            {BRAND.name} is a demonstration healthcare platform built to showcase a complete booking
            product. All doctor profiles, reviews and appointment records in this application are
            fictional and exist for illustration only. Nothing here constitutes medical advice. For a
            real health concern, consult a qualified clinician; in an emergency, contact your local
            emergency services immediately.
          </p>
        </section>

        <section className="mt-16 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Ready to find your doctor?</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink-600">
            Browse specialties, compare clinicians and hold a slot that works for your schedule.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/doctors" className="btn-primary btn-lg">
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
              Find a Doctor
            </Link>
            <Link to="/contact" className="btn-outline btn-lg">
              Contact us
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
