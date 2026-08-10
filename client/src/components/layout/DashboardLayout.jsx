import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Star,
  Stethoscope,
  User,
  Users,
  X,
} from 'lucide-react'
import Logo from './Logo'
import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'
import { cn } from '../../utils/helpers'

const MENUS = {
  [ROLES.PATIENT]: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/dashboard/profile', label: 'Profile', icon: User },
    { to: '/dashboard/settings', label: 'Settings', icon: Settings },
  ],
  [ROLES.DOCTOR]: [
    { to: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctor/availability', label: 'Availability', icon: CalendarClock },
    { to: '/doctor/reviews', label: 'Reviews', icon: Star },
    { to: '/doctor/profile', label: 'Profile', icon: User },
  ],
  [ROLES.ADMIN]: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/admin/patients', label: 'Patients', icon: Users },
    { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/admin/specialties', label: 'Specialties', icon: Star },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ],
}

const ROLE_LABEL = {
  [ROLES.PATIENT]: 'Patient account',
  [ROLES.DOCTOR]: 'Doctor account',
  [ROLES.ADMIN]: 'Administrator',
}

/** Shared shell for the patient, doctor and admin dashboards. */
export default function DashboardLayout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const items = MENUS[role] || MENUS[ROLES.PATIENT]

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const { overflow } = document.body.style
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [open])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) => cn('sidebar-link', isActive && 'sidebar-link-active')

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3">
        <Avatar src={user?.profileImage} name={user?.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
          <p className="truncate text-xs text-ink-500">{ROLE_LABEL[role]}</p>
        </div>
      </div>

      <nav aria-label="Dashboard" className="mt-4 flex-1 space-y-1">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-ink-100 pt-4">
        <Link to="/" className="sidebar-link">
          <Stethoscope className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          Back to site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="sidebar-link w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          Log out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-ink-50/60">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-100 bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open dashboard menu"
          aria-expanded={open}
          className="rounded-lg p-2 text-ink-600 transition hover:bg-ink-50"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-[100rem]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-ink-100 bg-white p-5 lg:flex">
          <Logo />
          <div className="mt-6 flex flex-1 flex-col">{sidebarContent}</div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 flex h-full w-[84%] max-w-xs flex-col bg-white p-5 shadow-pop">
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close dashboard menu"
                  className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-50"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-6 flex flex-1 flex-col overflow-y-auto">{sidebarContent}</div>
            </aside>
          </div>
        )}

        <main id="main-content" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
