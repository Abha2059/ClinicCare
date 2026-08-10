import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LoadingState } from '../components/common/States'
import { ROLES } from '../utils/constants'

/** Landing route for a role — used for post-login and wrong-role redirects. */
export function homeFor(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard'
  if (role === ROLES.DOCTOR) return '/doctor/dashboard'
  return '/dashboard'
}

/**
 * Requires an authenticated session, and optionally one of `allowedRoles`.
 * Waits for the session bootstrap so a page refresh doesn't eject a valid user.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking your session…" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so login can return them there.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={homeFor(role)} replace />
  }

  return <Outlet />
}

/** Keeps signed-in users away from /login and /register. */
export function PublicOnlyRoute() {
  const { isAuthenticated, role, initializing } = useAuth()
  const location = useLocation()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Loading…" />
      </div>
    )
  }

  if (isAuthenticated) {
    const target = location.state?.from?.pathname || homeFor(role)
    return <Navigate to={target} replace />
  }

  return <Outlet />
}
