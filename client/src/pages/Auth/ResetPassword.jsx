import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, KeyRound } from 'lucide-react'

import AuthLayout from './AuthLayout'
import PasswordInput from '../../components/forms/PasswordInput'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import authService from '../../services/authService'
import { getErrorMessage } from '../../utils/helpers'
import { confirmPasswordRule, rules } from '../../utils/validators'

export default function ResetPassword() {
  useDocumentTitle('Set a new password')
  const { token } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: '', confirmPassword: '' } })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await authService.resetPassword(token, { password: values.password })
      toast.success('Password updated. Please log in with your new password.')
      navigate('/login', { replace: true })
    } catch (err) {
      setFormError(getErrorMessage(err, 'This reset link is invalid or has expired.'))
    }
  }

  if (!token) {
    return (
      <AuthLayout
        title="Reset link required"
        subtitle="Open the reset link from your email to choose a new password."
        footer={
          <Link to="/forgot-password" className="link">
            Request a new link
          </Link>
        }
      >
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-sm text-amber-900">
            This page needs a valid reset token. Request a new password reset to continue.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Your new password must be different from the one you used before."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 link">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to log in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5">
            <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-600" aria-hidden="true" />
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <PasswordInput
          label="New password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          hint="Use 8+ characters with at least one letter and one number."
          error={errors.password?.message}
          {...register('password', rules.password)}
        />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          required
          placeholder="Re-enter your new password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRule(() => getValues('password')))}
        />

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  )
}
