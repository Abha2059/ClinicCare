import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react'
import Logo from './Logo'
import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'
import { cn } from '../../utils/helpers'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/doctors', label: 'Find Doctors' },
  { to: '/specialties', label: 'Specialties' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

/** Dashboard landing route for the current role. */
export function dashboardPath(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard'
  if (role === ROLES.DOCTOR) return '/doctor/dashboard'
  return '/dashboard'
}

export default function Header() {
  const { isAuthenticated, user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')

  const menuRef = useRef(null)
  const searchRef = useRef(null)

  // Close every overlay on navigation.
  useEffect(() => {
    setMobileOpen(false)
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    const { overflow } = document.body.style
    if (mobileOpen) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [mobileOpen])

  // Dismiss the profile dropdown on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return undefined
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/doctors?search=${encodeURIComponent(q)}` : '/doctors')
    setQuery('')
    setSearchOpen(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    cn(
      'relative rounded-lg px-3 py-2 text-sm font-medium transition',
      isActive ? 'text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
    )

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <a
        href="#main-content"
        className="sr-only-focusable absolute left-4 top-3 z-50 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Skip to main content
      </a>

      <div className="container-app">
        <div className="flex h-[var(--header-h)] items-center justify-between gap-3">
          <Logo />

          {/* Desktop navigation */}
          <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink to={dashboardPath(role)} className={navLinkClass}>
                Appointments
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {/* Desktop search */}
            <form onSubmit={handleSearch} role="search" className="hidden xl:block">
              <label htmlFor="header-search" className="sr-only">
                Search doctors
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <input
                  id="header-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search doctors…"
                  className="input h-10 w-56 pl-9 text-sm"
                />
              </div>
            </form>

            {/* Compact search toggle */}
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search doctors"
              aria-expanded={searchOpen}
              className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-50 hover:text-ink-900 xl:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <div className="relative hidden lg:block" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl border border-ink-200 py-1.5 pl-1.5 pr-2.5 transition hover:border-brand-300 hover:bg-brand-50/60"
                >
                  <Avatar src={user?.profileImage} name={user?.name} size="xs" />
                  <span className="max-w-[9rem] truncate text-sm font-medium text-ink-800">
                    {user?.name}
                  </span>
                  <ChevronDown
                    className={cn('h-4 w-4 text-ink-400 transition', menuOpen && 'rotate-180')}
                    aria-hidden="true"
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 animate-fade-up overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop"
                  >
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                      <p className="truncate text-xs text-ink-500">{user?.email}</p>
                      <span className="badge-brand mt-2 capitalize">{role}</span>
                    </div>
                    <div className="p-1.5">
                      <Link to={dashboardPath(role)} role="menuitem" className="sidebar-link">
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                        Dashboard
                      </Link>
                      {role === ROLES.PATIENT && (
                        <Link to="/dashboard/appointments" role="menuitem" className="sidebar-link">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          My Appointments
                        </Link>
                      )}
                      <Link
                        to={role === ROLES.DOCTOR ? '/doctor/profile' : role === ROLES.ADMIN ? '/admin/settings' : '/dashboard/profile'}
                        role="menuitem"
                        className="sidebar-link"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Profile
                      </Link>
                      {role === ROLES.PATIENT && (
                        <Link to="/dashboard/settings" role="menuitem" className="sidebar-link">
                          <Settings className="h-4 w-4" aria-hidden="true" />
                          Settings
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-ink-100 p-1.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/register" className="btn-primary">
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-50 lg:hidden"
            >
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Collapsible search bar for small screens */}
        {searchOpen && (
          <form onSubmit={handleSearch} role="search" className="animate-fade-in pb-3 xl:hidden">
            <label htmlFor="mobile-search" className="sr-only">
              Search doctors
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                id="mobile-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by doctor name or specialty…"
                className="input pl-10"
              />
            </div>
          </form>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm animate-slide-in-right flex-col bg-white shadow-pop">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-50"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn('sidebar-link text-base', isActive && 'sidebar-link-active')
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/faq"
                  className={({ isActive }) => cn('sidebar-link text-base', isActive && 'sidebar-link-active')}
                >
                  FAQ
                </NavLink>
              </div>

              {isAuthenticated && (
                <>
                  <hr className="my-4 border-ink-100" />
                  <div className="mb-3 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
                    <Avatar src={user?.profileImage} name={user?.name} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
                      <p className="truncate text-xs capitalize text-ink-500">{role}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <NavLink to={dashboardPath(role)} className="sidebar-link text-base">
                      <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
                      Dashboard
                    </NavLink>
                    {role === ROLES.PATIENT && (
                      <>
                        <NavLink to="/dashboard/appointments" className="sidebar-link text-base">
                          <CalendarDays className="h-5 w-5" aria-hidden="true" />
                          My Appointments
                        </NavLink>
                        <NavLink to="/dashboard/profile" className="sidebar-link text-base">
                          <User className="h-5 w-5" aria-hidden="true" />
                          Profile
                        </NavLink>
                      </>
                    )}
                  </div>
                </>
              )}
            </nav>

            <div className="border-t border-ink-100 p-4">
              {isAuthenticated ? (
                <button type="button" onClick={handleLogout} className="btn-outline w-full text-red-600">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              ) : (
                <div className="grid gap-2">
                  <Link to="/login" className="btn-outline w-full">
                    Log in
                  </Link>
                  <Link to="/register" className="btn-primary w-full">
                    Create account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
