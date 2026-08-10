import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, ShieldCheck } from 'lucide-react'
import Logo from './Logo'
import { BRAND } from '../../utils/constants'

const COLUMNS = [
  {
    title: 'Care',
    links: [
      { label: 'Find Doctors', to: '/doctors' },
      { label: 'Specialties', to: '/specialties' },
      { label: 'Book an Appointment', to: '/doctors' },
      { label: 'FAQ', to: '/faq' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About ClinicCare', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Create Account', to: '/register' },
      { label: 'Log In', to: '/login' },
    ],
  },
]

const POPULAR_SPECIALTIES = [
  { label: 'General Health', slug: 'general-health' },
  { label: 'Child Care', slug: 'child-care' },
  { label: 'Skin & Hair', slug: 'skin-and-hair-health' },
  { label: "Women's Health", slug: 'womens-health' },
  { label: 'Heart Health', slug: 'heart-health' },
  { label: 'Dental Health', slug: 'dental-health' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-ink-100 bg-ink-900 text-ink-300">
      <div className="container-app py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo invert showTagline />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">
              ClinicCare helps you discover trusted healthcare professionals and manage your clinic
              appointments in one secure place.
            </p>
            <div className="mt-5 space-y-2.5 text-sm">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <span className="text-ink-400">{BRAND.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`tel:${BRAND.supportPhone.replace(/\s/g, '')}`} className="text-ink-400 transition hover:text-white">
                  {BRAND.supportPhone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-brand-400" aria-hidden="true" />
                <a href={`mailto:${BRAND.supportEmail}`} className="text-ink-400 transition hover:text-white">
                  {BRAND.supportEmail}
                </a>
              </p>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="lg:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white">{col.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-ink-400 transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Popular specialties" className="lg:col-span-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white">
              Popular Specialties
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {POPULAR_SPECIALTIES.map((s) => (
                <li key={s.slug}>
                  <Link
                    to={`/specialties/${s.slug}`}
                    className="inline-block rounded-lg border border-ink-700 px-3 py-1.5 text-xs font-medium text-ink-300 transition hover:border-brand-500 hover:bg-brand-500/10 hover:text-white"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-ink-700 bg-ink-800/60 p-3.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-ink-400">
                Your account and appointment details are protected with encrypted authentication.
              </p>
            </div>
          </nav>
        </div>

        <div className="mt-10 border-t border-ink-800 pt-6">
          <p className="text-xs leading-relaxed text-ink-500">
            <strong className="font-semibold text-ink-400">Health information notice:</strong>{' '}
            ClinicCare provides appointment scheduling and doctor discovery only. Content on this
            platform is for general information and is not a substitute for professional medical
            advice, diagnosis or treatment. In an emergency, contact your local emergency services
            immediately.
          </p>
          <div className="mt-5 flex flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
            <p>
              &copy; {year} {BRAND.name}. All rights reserved.
            </p>
            <p>Built as a demonstration healthcare platform with fictional doctor profiles.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
