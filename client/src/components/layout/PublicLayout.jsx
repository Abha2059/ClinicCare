import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

/** Shell for all public + auth-visible marketing pages. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
