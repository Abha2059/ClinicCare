import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { KeyRound, Save, ShieldCheck, UserRound, Users } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import { Input } from '../../components/forms/FormField'
import PasswordInput from '../../components/forms/PasswordInput'
import { EmptyState, ErrorState, TableSkeleton } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import authService from '../../services/authService'
import adminService from '../../services/adminService'
import { formatDate, getErrorMessage } from '../../utils/helpers'
import { confirmPasswordRule, rules } from '../../utils/validators'

export default function AdminSettings() {
  useDocumentTitle('Admin settings')
  const { user, applyUser } = useAuth()
  const toast = useToast()

  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [adminsError, setAdminsError] = useState(null)

  const profileForm = useForm({
    defaultValues: { name: user?.name || '', phone: user?.phone || '', profileImage: user?.profileImage || '' },
  })

  const passwordForm = useForm({
    defaultValues: { currentPassword: '', password: '', confirmPassword: '' },
  })

  const loadAdmins = useCallback(async () => {
    setLoadingAdmins(true)
    setAdminsError(null)
    try {
      const data = await adminService.users({ role: 'admin', limit: 20 })
      setAdmins(data.users || [])
    } catch (err) {
      setAdminsError(getErrorMessage(err, 'Administrator accounts could not be loaded.'))
      setAdmins([])
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        phone: user.phone || '',
        profileImage: user.profileImage || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const saveProfile = async (values) => {
    try {
      const data = await authService.updateProfile({
        name: values.name.trim(),
        phone: values.phone.trim(),
        profileImage: values.profileImage.trim(),
      })
      applyUser(data.user)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Your profile could not be updated.'))
    }
  }

  const savePassword = async (values) => {
    try {
      await authService.changePassword({
        currentPassword: values.currentPassword,
        password: values.password,
      })
      toast.success('Password changed successfully.')
      passwordForm.reset({ currentPassword: '', password: '', confirmPassword: '' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Your password could not be changed.'))
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your administrator account and platform access." />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Profile ---------- */}
        <section className="card card-body">
          <h2 className="inline-flex items-center gap-2 font-semibold text-ink-900">
            <UserRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Your profile
          </h2>

          <form
            onSubmit={profileForm.handleSubmit(saveProfile)}
            noValidate
            className="mt-5 space-y-4"
          >
            <Input
              label="Full name"
              required
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name', rules.name)}
            />
            <Input
              label="Phone number"
              type="tel"
              inputMode="numeric"
              required
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone', rules.phone)}
            />
            <Input
              label="Profile photo URL"
              type="url"
              placeholder="https://example.com/photo.jpg"
              hint="Optional."
              error={profileForm.formState.errors.profileImage?.message}
              {...profileForm.register('profileImage', {
                validate: (v) => !v || /^https?:\/\/.+/i.test(v) || 'Enter a valid http(s) image URL',
              })}
            />

            <button
              type="submit"
              disabled={profileForm.formState.isSubmitting}
              className="btn-primary w-full"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {profileForm.formState.isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        {/* ---------- Password ---------- */}
        <section className="card card-body">
          <h2 className="inline-flex items-center gap-2 font-semibold text-ink-900">
            <KeyRound className="h-5 w-5 text-brand-600" aria-hidden="true" />
            Change password
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Administrator accounts have elevated access — use a strong, unique password.
          </p>

          <form
            onSubmit={passwordForm.handleSubmit(savePassword)}
            noValidate
            className="mt-5 space-y-4"
          >
            <PasswordInput
              label="Current password"
              autoComplete="current-password"
              required
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword', { required: 'Enter your current password' })}
            />
            <PasswordInput
              label="New password"
              autoComplete="new-password"
              required
              hint="Use 8+ characters with at least one letter and one number."
              error={passwordForm.formState.errors.password?.message}
              {...passwordForm.register('password', rules.password)}
            />
            <PasswordInput
              label="Confirm new password"
              autoComplete="new-password"
              required
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register(
                'confirmPassword',
                confirmPasswordRule(() => passwordForm.getValues('password')),
              )}
            />

            <button
              type="submit"
              disabled={passwordForm.formState.isSubmitting}
              className="btn-primary w-full"
            >
              {passwordForm.formState.isSubmitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>

      {/* ---------- Administrators ---------- */}
      <section className="mt-6" aria-labelledby="admins-heading">
        <h2
          id="admins-heading"
          className="mb-3 inline-flex items-center gap-2 text-lg font-semibold text-ink-900"
        >
          <Users className="h-5 w-5 text-brand-600" aria-hidden="true" />
          Administrator accounts
        </h2>

        {loadingAdmins && (
          <div className="table-wrap">
            <TableSkeleton rows={3} cols={3} />
          </div>
        )}

        {!loadingAdmins && adminsError && (
          <ErrorState title="Could not load administrators" message={adminsError} onRetry={loadAdmins} />
        )}

        {!loadingAdmins && !adminsError && admins.length === 0 && (
          <EmptyState
            icon={Users}
            title="No administrator accounts found"
            message="Administrator accounts are created directly in the database or by the seed script."
          />
        )}

        {!loadingAdmins && !adminsError && admins.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Administrator</th>
                  <th scope="col">Phone</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={admin.profileImage} name={admin.name} size="xs" />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-ink-900">
                            {admin.name}
                            {admin._id === user?.id && (
                              <span className="ml-2 text-xs font-normal text-brand-700">(you)</span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-ink-500">{admin.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{admin.phone || '—'}</td>
                    <td className="whitespace-nowrap">
                      {formatDate(admin.createdAt, { weekday: undefined })}
                    </td>
                    <td>
                      <span className={admin.isActive !== false ? 'badge-success' : 'badge-danger'}>
                        {admin.isActive !== false ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ---------- Security note ---------- */}
      <section className="mt-6 rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-ink-900">
          <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Platform security
        </h2>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-600">
          <li>Passwords are hashed with bcrypt and are never stored or transmitted in plain text.</li>
          <li>Administrator routes are protected by role-based middleware on the server.</li>
          <li>New registrations are always created as patients — roles cannot be self-assigned.</li>
          <li>Secrets are read from environment variables and are never committed to the repository.</li>
        </ul>
      </section>
    </>
  )
}
