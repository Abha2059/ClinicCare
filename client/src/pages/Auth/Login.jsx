import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, LogIn, Mail } from 'lucide-react'

import AuthLayout from './AuthLayout'
import { Input } from '../../components/forms/FormField'
import PasswordInput from '../../components/forms/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { homeFor } from '../../routes/ProtectedRoute'
import { rules } from '../../utils/validators'

export default function Login() {
  useDocumentTitle('Log in')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } })

  const onSubmit = async (values) => {
    setFormError(null)
    const result = await login({
      email: values.email.trim().toLowerCase(),
      password: values.password,
    })

    if (!result.success) {
      setFormError(result.message)
      return
    }

    toast.success(`Welcome back, ${result.user.name.split(' ')[0]}.`)
    // Return the user to wherever a guard intercepted them, else their dashboard.
    const target = location.state?.from?.pathname || homeFor(result.user.role)
    navigate(target, { replace: true })
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage your appointments and health records."
      footer={
        <>
          New to ClinicCare?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5"
          >
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          required
          icon={Mail}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', rules.email)}
        />

        <div>
          <PasswordInput
            label="Password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register('password', rules.loginPassword)}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          <LogIn className="h-5 w-5" aria-hidden="true" />
          {isSubmitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-ink-100 bg-ink-50/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Demo accounts
        </p>
        <ul className="mt-2 space-y-1 text-xs text-ink-600">
          <li>
            <span className="font-medium text-ink-800">Patient:</span> patient@cliniccare.com
          </li>
          <li>
            <span className="font-medium text-ink-800">Doctor:</span> doctor@cliniccare.com
          </li>
          <li>
            <span className="font-medium text-ink-800">Admin:</span> admin@cliniccare.com
          </li>
          <li className="pt-1 text-ink-500">
            Password for all demo accounts: <span className="font-mono">Password123</span>
          </li>
        </ul>
      </div>
    </AuthLayout>
  )
}
