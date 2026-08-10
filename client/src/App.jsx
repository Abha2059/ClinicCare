import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'
import ScrollToTop from './components/layout/ScrollToTop'
import ToastContainer from './components/common/Toast'
import { LoadingState } from './components/common/States'
import ProtectedRoute, { PublicOnlyRoute } from './routes/ProtectedRoute'
import { ROLES } from './utils/constants'

// Public pages — eager for the landing experience, lazy for the rest.
import Home from './pages/Home/Home'

const Doctors = lazy(() => import('./pages/Doctors/Doctors'))
const DoctorDetails = lazy(() => import('./pages/DoctorDetails/DoctorDetails'))
const Specialties = lazy(() => import('./pages/Specialties/Specialties'))
const SpecialtyDetails = lazy(() => import('./pages/Specialties/SpecialtyDetails'))
const BookAppointment = lazy(() => import('./pages/Appointment/BookAppointment'))
const BookingSuccess = lazy(() => import('./pages/Appointment/BookingSuccess'))
const About = lazy(() => import('./pages/About/About'))
const Contact = lazy(() => import('./pages/Contact/Contact'))
const FAQ = lazy(() => import('./pages/FAQ/FAQ'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))

// Auth
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))

// Patient
const PatientDashboard = lazy(() => import('./pages/PatientDashboard/PatientDashboard'))
const PatientAppointments = lazy(() => import('./pages/PatientDashboard/PatientAppointments'))
const AppointmentDetails = lazy(() => import('./pages/PatientDashboard/AppointmentDetails'))
const PatientProfile = lazy(() => import('./pages/PatientDashboard/PatientProfile'))
const PatientSettings = lazy(() => import('./pages/PatientDashboard/PatientSettings'))

// Doctor
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard/DoctorDashboard'))
const DoctorAppointments = lazy(() => import('./pages/DoctorDashboard/DoctorAppointments'))
const DoctorAvailability = lazy(() => import('./pages/DoctorDashboard/DoctorAvailability'))
const DoctorProfileEdit = lazy(() => import('./pages/DoctorDashboard/DoctorProfileEdit'))
const DoctorReviews = lazy(() => import('./pages/DoctorDashboard/DoctorReviews'))

// Admin
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'))
const AdminDoctors = lazy(() => import('./pages/AdminDashboard/AdminDoctors'))
const AdminPatients = lazy(() => import('./pages/AdminDashboard/AdminPatients'))
const AdminAppointments = lazy(() => import('./pages/AdminDashboard/AdminAppointments'))
const AdminSpecialties = lazy(() => import('./pages/AdminDashboard/AdminSpecialties'))
const AdminSettings = lazy(() => import('./pages/AdminDashboard/AdminSettings'))

function PageFallback() {
  return (
    <div className="container-app py-24">
      <LoadingState label="Loading page…" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ToastContainer />

      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* ---------- Public ---------- */}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="doctors" element={<Doctors />} />
            <Route path="doctors/:id" element={<DoctorDetails />} />
            <Route path="specialties" element={<Specialties />} />
            <Route path="specialties/:slug" element={<SpecialtyDetails />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="faq" element={<FAQ />} />

            {/* Booking requires a signed-in patient */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.PATIENT]} />}>
              <Route path="appointments/book/:doctorId" element={<BookAppointment />} />
              <Route path="appointments/success/:id" element={<BookingSuccess />} />
            </Route>

            {/* ---------- Auth ---------- */}
            <Route element={<PublicOnlyRoute />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password/:token" element={<ResetPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>
          </Route>

          {/* ---------- Patient dashboard ---------- */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.PATIENT]} />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<PatientAppointments />} />
              <Route path="appointments/:id" element={<AppointmentDetails />} />
              <Route path="profile" element={<PatientProfile />} />
              <Route path="settings" element={<PatientSettings />} />
            </Route>
          </Route>

          {/* ---------- Doctor dashboard ---------- */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.DOCTOR]} />}>
            <Route path="/doctor" element={<DashboardLayout />}>
              <Route path="dashboard" element={<DoctorDashboard />} />
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="appointments/:id" element={<AppointmentDetails />} />
              <Route path="availability" element={<DoctorAvailability />} />
              <Route path="reviews" element={<DoctorReviews />} />
              <Route path="profile" element={<DoctorProfileEdit />} />
            </Route>
          </Route>

          {/* ---------- Admin dashboard ---------- */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<DashboardLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="doctors" element={<AdminDoctors />} />
              <Route path="patients" element={<AdminPatients />} />
              <Route path="appointments" element={<AdminAppointments />} />
              <Route path="appointments/:id" element={<AppointmentDetails />} />
              <Route path="specialties" element={<AdminSpecialties />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* ---------- 404 ---------- */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
