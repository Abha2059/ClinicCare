import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone, Save, UserRound } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import { Input } from '../../components/forms/FormField'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import authService from '../../services/authService'
import { getErrorMessage } from '../../utils/helpers'
import { rules } from '../../utils/validators'

export default function PatientProfile() {
  useDocumentTitle('My profile')
  const { user, applyUser } = useAuth()
  const toast = useToast()
  const [formError, setFormError] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      profileImage: user?.profileImage || '',
    },
  })

  // Keep the form in sync once the session finishes loading.
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || '',
      })
    }
  }, [user, reset])

  const watchedImage = watch('profileImage')
  const watchedName = watch('name')

  const onSubmit = async (values) => {
    setFormError(null)
    try {
      const data = await authService.updateProfile({
        name: values.name.trim(),
        phone: values.phone.trim(),
        profileImage: values.profileImage.trim(),
      })
      applyUser(data.user)
      reset({
        name: data.user.name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        profileImage: data.user.profileImage || '',
      })
      toast.success('Profile updated.')
    } catch (err) {
      const message = getErrorMessage(err, 'Your profile could not be updated.')
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <>
      <PageHeader title="My profile" description="Keep your contact details accurate for the clinic." />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="card card-body space-y-4">
          {formError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
              {formError}
            </p>
          )}

          <Input
            label="Full name"
            required
            icon={UserRound}
            error={errors.name?.message}
            {...register('name', rules.name)}
          />

          <Input
            label="Email address"
            type="email"
            icon={Mail}
            readOnly
            disabled
            hint="Your email is used to sign in and cannot be changed here."
            {...register('email')}
          />

          <Input
            label="Phone number"
            type="tel"
            inputMode="numeric"
            required
            icon={Phone}
            placeholder="10-digit mobile number"
            error={errors.phone?.message}
            {...register('phone', rules.phone)}
          />

          <Input
            label="Profile photo URL"
            type="url"
            placeholder="https://example.com/your-photo.jpg"
            hint="Optional. Leave blank to use your initials."
            error={errors.profileImage?.message}
            {...register('profileImage', {
              validate: (value) =>
                !value || /^https?:\/\/.+/i.test(value) || 'Enter a valid http(s) image URL',
            })}
          />

          <div className="flex justify-end border-t border-ink-100 pt-4">
            <button type="submit" disabled={isSubmitting || !isDirty} className="btn-primary">
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>

        <aside className="card card-body h-fit text-center">
          <h2 className="text-sm font-semibold text-ink-900">Profile preview</h2>
          <div className="mt-5 flex flex-col items-center">
            <Avatar src={watchedImage} name={watchedName || user?.name} size="xl" />
            <p className="mt-4 font-semibold text-ink-900">{watchedName || user?.name}</p>
            <p className="mt-0.5 break-all text-sm text-ink-500">{user?.email}</p>
            <span className="badge-brand mt-3 capitalize">{user?.role}</span>
          </div>
        </aside>
      </div>
    </>
  )
}
