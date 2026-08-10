import { Link } from 'react-router-dom'
import { BadgeCheck, CalendarCheck, ShieldCheck } from 'lucide-react'
import Logo from '../../components/layout/Logo'
import { BRAND } from '../../utils/constants'

const HIGHLIGHTS = [
  { icon: BadgeCheck, text: 'Verified doctors across 17 specialties' },
  { icon: CalendarCheck, text: 'Real-time slot availability, no double bookings' },
  { icon: ShieldCheck, text: 'Encrypted passwords and private appointment records' },
]

/** Split-screen shell shared by every auth screen. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-[calc(100vh-var(--header-h))] lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-7 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-600">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-ink-600">{footer}</div>}
        </div>
      </div>

      {/* Brand side */}
      <aside className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:items-center">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(40rem 30rem at 80% 10%, rgba(31,166,138,.28), transparent 60%), radial-gradient(30rem 24rem at 10% 90%, rgba(246,107,19,.18), transparent 60%)',
          }}
        />

        <div className="relative px-12 py-16">
          <Logo invert />

          <h2 className="mt-10 max-w-md font-display text-3xl font-bold leading-tight text-white">
            {BRAND.tagline}
          </h2>
          <p className="mt-4 max-w-md leading-relaxed text-ink-300">
            Join {BRAND.name} to discover trusted clinicians, hold appointment slots that are
            genuinely free, and keep every visit in one secure place.
          </p>

          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-400">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-sm text-ink-200">{item.text}</span>
              </li>
            ))}
          </ul>

          <p className="mt-12 text-xs text-ink-500">
            A demonstration platform with fictional doctor profiles.{' '}
            <Link to="/about" className="underline underline-offset-4 hover:text-ink-300">
              Learn more
            </Link>
          </p>
        </div>
      </aside>
    </div>
  )
}
