import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import PasswordInput from '../../components/forms/PasswordInput'
import { ConfirmModal } from '../../components/common/Modal'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import authService from '../../services/authService'
import { getErrorMessage } from '../../utils/helpers'
import { confirmPasswordRule, rules } from '../../utils/validators'

export default function PatientSettings() {
  useDocumentTitle('Settings')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [formError, setFormError] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      })
      toast.success('Password changed successfully.')
      reset({ currentPassword: '', password: '', confirmPassword: '' })
    } catch (err) {
      const message = getErrorMessage(err, 'Your password could not be changed.')
      setFormError(message)
      toast.error(message)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account security and session." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Change password ---------- */}
        <section className="card card-body">
          <h2 className="inline-flex items-center gap-2 font-semibold text-ink-900">
            <KeyRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Change password
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Choose a strong password you do not use on other sites.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
            {formError && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                {formError}
              </p>
            )}

            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              required
              error={errors.currentPassword?.message}
              {...register('currentPassword', { required: 'Enter your current password' })}
            />

            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              hint="Use 8+ characters with at least one letter and one number."
              error={errors.password?.message}
              {...register('password', rules.password)}
            />

            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', confirmPasswordRule(() => getValues('password')))}
            />

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          {/* ---------- Account overview ---------- */}
          <section className="card card-body">
            <h2 className="inline-flex items-center gap-2 font-semibold text-ink-900">
              <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
              Account
            </h2>
            <dl className="mt-4 divide-y divide-ink-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">Name</dt>
                <dd className="font-medium text-ink-900">{user?.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">Email</dt>
                <dd className="break-all text-right font-medium text-ink-900">{user?.email}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">Phone</dt>
                <dd className="font-medium text-ink-900">{user?.phone || '—'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">Account type</dt>
                <dd className="font-medium capitalize text-ink-900">{user?.role}</dd>
              </div>
            </dl>
          </section>

          {/* ---------- Session ---------- */}
          <section className="card card-body">
            <h2 className="font-semibold text-ink-900">Session</h2>
            <p className="mt-1 text-sm text-ink-500">
              Signing out clears your session on this device.
            </p>
            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className="btn-outline mt-4 w-full text-red-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </section>

          {/* ---------- Privacy note ---------- */}
          <section className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
            <h2 className="text-sm font-semibold text-ink-900">Your data</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              Your appointment records are visible only to you, the doctor you booked with, and
              ClinicCare administrators. Passwords are stored as secure one-way hashes and are never
              readable by anyone, including our team.
            </p>
          </section>
        </div>
      </div>

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Log out of ClinicCare?"
        message="You will need to sign in again to view your appointments."
        confirmLabel="Log out"
        cancelLabel="Stay signed in"
      />
    </>
  )
}
