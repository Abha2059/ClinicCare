import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react'

import AuthLayout from './AuthLayout'
import { Input } from '../../components/forms/FormField'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import authService from '../../services/authService'
import { getErrorMessage } from '../../utils/helpers'
import { rules } from '../../utils/validators'

export default function ForgotPassword() {
  useDocumentTitle('Forgot password')
  const [sent, setSent] = useState(false)
  const [resetPath, setResetPath] = useState(null)
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '' } })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const data = await authService.forgotPassword({ email: values.email.trim().toLowerCase() })
      setSent(true)
      // This demo platform has no mail service, so the API returns the reset
      // path directly to keep the flow completable end to end.
      if (data.resetPath) setResetPath(data.resetPath)
    } catch (err) {
      setFormError(getErrorMessage(err, 'We could not process that request.'))
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email address linked to your ClinicCare account."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 link">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-emerald-900">Check your inbox</p>
              <p className="mt-1 text-sm text-emerald-800">
                If an account exists for that address, a password reset link has been generated.
                The link expires in 30 minutes.
              </p>
            </div>
          </div>

          {resetPath && (
            <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Demo mode
              </p>
              <p className="mt-1.5 text-sm text-ink-600">
                No mail service is configured, so you can continue directly:
              </p>
              <Link to={resetPath} className="btn-primary btn-sm mt-3">
                Set a new password
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
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

          <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
            <Send className="h-5 w-5" aria-hidden="true" />
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}
