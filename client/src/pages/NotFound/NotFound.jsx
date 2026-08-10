import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Home, Search, Stethoscope } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

const SUGGESTIONS = [
  { label: 'Find a doctor', to: '/doctors', icon: Stethoscope },
  { label: 'Browse specialties', to: '/specialties', icon: Search },
  { label: 'Go to homepage', to: '/', icon: Home },
]

export default function NotFound() {
  useDocumentTitle('Page not found')
  const navigate = useNavigate()

  return (
    <div className="container-app flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-lg text-center">
        <p className="font-display text-7xl font-bold text-brand-200 sm:text-8xl">404</p>
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">We could not find that page</h1>
        <p className="mt-3 text-ink-600">
          The link may be outdated, or the page may have moved. Here are a few useful places to go
          instead.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {SUGGESTIONS.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="card-hover flex h-full flex-col items-center gap-2 p-4 text-sm font-medium text-ink-700"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <button type="button" onClick={() => navigate(-1)} className="btn-ghost mt-7">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go back
        </button>
      </div>
    </div>
  )
}
