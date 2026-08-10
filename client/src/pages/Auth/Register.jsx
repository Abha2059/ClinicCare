import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, Mail, Phone, UserPlus, UserRound } from 'lucide-react'

import AuthLayout from './AuthLayout'
import { Checkbox, Input } from '../../components/forms/FormField'
import PasswordInput from '../../components/forms/PasswordInput'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { confirmPasswordRule, rules } from '../../utils/validators'

export default function Register() {
  useDocumentTitle('Create account')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', terms: false },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    // Role is never taken from the form — the API creates patients only.
    const result = await registerUser({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      password: values.password,
    })

    if (!result.success) {
      setFormError(result.message)
      return
    }

    toast.success('Your ClinicCare account is ready.')
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Book appointments and keep your visit history in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="link">
            Log in
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
          label="Full name"
          autoComplete="name"
          required
          icon={UserRound}
          placeholder="Your full name"
          error={errors.name?.message}
          {...register('name', rules.name)}
        />

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

        <Input
          label="Phone number"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          icon={Phone}
          placeholder="10-digit mobile number"
          error={errors.phone?.message}
          {...register('phone', rules.phone)}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          hint="Use 8+ characters with at least one letter and one number."
          error={errors.password?.message}
          {...register('password', rules.password)}
        />

        <PasswordInput
          label="Confirm password"
          autoComplete="new-password"
          required
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRule(() => getValues('password')))}
        />

        <Checkbox
          label={
            <>
              I agree to the ClinicCare terms of use and understand this platform provides
              appointment scheduling, not medical advice.
            </>
          }
          error={errors.terms?.message}
          {...register('terms', { required: 'Please accept the terms to continue' })}
        />

        <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg w-full">
          <UserPlus className="h-5 w-5" aria-hidden="true" />
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-xs text-ink-400">
          Doctor and administrator accounts are created by the ClinicCare team.{' '}
          <Link to="/contact" className="link">
            Contact us
          </Link>{' '}
          to join as a clinician.
        </p>
      </form>
    </AuthLayout>
  )
}
