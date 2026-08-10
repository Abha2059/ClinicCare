import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BadgeCheck, Phone, Save, UserRound, X } from 'lucide-react'

import PageHeader from '../../components/dashboard/PageHeader'
import Avatar from '../../components/common/Avatar'
import Rating from '../../components/common/Rating'
import { Input, Select, Textarea } from '../../components/forms/FormField'
import { ErrorState, LoadingState } from '../../components/common/States'
import { useAuth } from '../../context/AuthContext'
import { useApp, useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import doctorService from '../../services/doctorService'
import authService from '../../services/authService'
import { LANGUAGE_OPTIONS } from '../../utils/constants'
import { getErrorMessage } from '../../utils/helpers'
import { rules } from '../../utils/validators'

export default function DoctorProfileEdit() {
  useDocumentTitle('My profile')
  const { user, applyUser } = useAuth()
  const { specialties } = useApp()
  const toast = useToast()

  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [languages, setLanguages] = useState([])
  const [expertise, setExpertise] = useState([])
  const [expertiseInput, setExpertiseInput] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await doctorService.me()
      const d = data.doctor
      setDoctor(d)
      setLanguages(d?.languages || [])
      setExpertise(d?.expertise || [])
      reset({
        name: user?.name || '',
        phone: user?.phone || '',
        profileImage: user?.profileImage || '',
        specialty: d?.specialty?._id || '',
        qualification: d?.qualification || '',
        experience: d?.experience ?? 0,
        consultationFee: d?.consultationFee ?? 500,
        bio: d?.bio || '',
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Your profile could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [reset, user])

  useEffect(() => {
    load()
  }, [load])

  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    )
  }

  const addExpertise = () => {
    const value = expertiseInput.trim()
    if (!value) return
    if (expertise.includes(value)) {
      toast.warning('That area of expertise is already listed.')
      return
    }
    setExpertise((prev) => [...prev, value])
    setExpertiseInput('')
  }

  const onSubmit = async (values) => {
    try {
      // The account fields live on User; the clinical fields live on Doctor.
      const [accountData] = await Promise.all([
        authService.updateProfile({
          name: values.name.trim(),
          phone: values.phone.trim(),
          profileImage: values.profileImage.trim(),
        }),
        doctorService.updateMe({
          specialty: values.specialty,
          qualification: values.qualification.trim(),
          experience: Number(values.experience),
          consultationFee: Number(values.consultationFee),
          bio: values.bio.trim(),
          languages,
          expertise,
        }),
      ])
      applyUser(accountData.user)
      toast.success('Profile updated.')
      load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Your profile could not be saved.'))
    }
  }

  if (loading) return <LoadingState label="Loading your profile…" className="py-24" />
  if (error) return <ErrorState title="Profile unavailable" message={error} onRetry={load} />

  const watchedImage = watch('profileImage')
  const watchedName = watch('name')

  return (
    <>
      <PageHeader
        title="My profile"
        description="This information appears on your public ClinicCare listing."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Account details */}
          <section className="card card-body space-y-4">
            <h2 className="font-semibold text-ink-900">Account details</h2>

            <Input
              label="Display name"
              required
              icon={UserRound}
              hint="Shown to patients, e.g. “Dr. Anita Rao”."
              error={errors.name?.message}
              {...register('name', rules.name)}
            />

            <Input
              label="Phone number"
              type="tel"
              inputMode="numeric"
              required
              icon={Phone}
              error={errors.phone?.message}
              {...register('phone', rules.phone)}
            />

            <Input
              label="Profile photo URL"
              type="url"
              placeholder="https://example.com/photo.jpg"
              hint="Optional. Leave blank to use your initials."
              error={errors.profileImage?.message}
              {...register('profileImage', {
                validate: (v) => !v || /^https?:\/\/.+/i.test(v) || 'Enter a valid http(s) image URL',
              })}
            />
          </section>

          {/* Clinical details */}
          <section className="card card-body space-y-4">
            <h2 className="font-semibold text-ink-900">Clinical details</h2>

            <Select
              label="Specialty"
              required
              placeholder="Select your specialty"
              options={specialties.map((s) => ({ value: s._id, label: s.name }))}
              error={errors.specialty?.message}
              {...register('specialty', rules.required('Specialty'))}
            />

            <Input
              label="Qualification"
              required
              placeholder="e.g. MBBS, MD (General Medicine)"
              error={errors.qualification?.message}
              {...register('qualification', rules.required('Qualification'))}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Years of experience"
                type="number"
                min="0"
                max="70"
                required
                error={errors.experience?.message}
                {...register('experience', {
                  required: 'Experience is required',
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 70, message: 'Please enter a realistic value' },
                })}
              />
              <Input
                label="Consultation fee (₹)"
                type="number"
                min="0"
                step="50"
                required
                error={errors.consultationFee?.message}
                {...register('consultationFee', {
                  required: 'Consultation fee is required',
                  min: { value: 0, message: 'Cannot be negative' },
                })}
              />
            </div>

            <Textarea
              label="About you"
              rows={5}
              placeholder="Describe your practice, approach and areas of focus…"
              hint="This appears in the About section of your public profile."
              error={errors.bio?.message}
              {...register('bio', {
                maxLength: { value: 1000, message: 'Keep your bio under 1000 characters' },
              })}
            />
          </section>

          {/* Languages */}
          <section className="card card-body">
            <h2 className="font-semibold text-ink-900">Languages spoken</h2>
            <p className="mt-1 text-sm text-ink-500">Select every language you consult in.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => {
                const selected = languages.includes(lang)
                return (
                  <button
                    key={lang}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      selected
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {lang}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Expertise */}
          <section className="card card-body">
            <h2 className="font-semibold text-ink-900">Areas of expertise</h2>
            <p className="mt-1 text-sm text-ink-500">
              Add the conditions and procedures you handle most often.
            </p>

            <div className="mt-4 flex gap-2">
              <label htmlFor="expertise-input" className="sr-only">
                Add an area of expertise
              </label>
              <input
                id="expertise-input"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addExpertise()
                  }
                }}
                placeholder="e.g. Diabetes management"
                className="input h-10 flex-1"
              />
              <button type="button" onClick={addExpertise} className="btn-outline h-10">
                Add
              </button>
            </div>

            {expertise.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1.5 text-sm text-ink-700">
                    {item}
                    <button
                      type="button"
                      onClick={() => setExpertise((prev) => prev.filter((e) => e !== item))}
                      aria-label={`Remove ${item}`}
                      className="rounded-full p-0.5 text-ink-400 transition hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={isSubmitting} className="btn-primary btn-lg">
              <Save className="h-5 w-5" aria-hidden="true" />
              {isSubmitting ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>

        {/* Preview */}
        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <div className="card card-body text-center">
            <h2 className="text-sm font-semibold text-ink-900">Public preview</h2>
            <div className="mt-5 flex flex-col items-center">
              <Avatar src={watchedImage} name={watchedName || user?.name} size="xl" />
              <p className="mt-4 font-semibold text-ink-900">{watchedName || user?.name}</p>
              <p className="mt-0.5 text-sm text-brand-700">
                {doctor?.specialty?.name || 'Specialty not set'}
              </p>
              <Rating value={doctor?.rating || 0} count={doctor?.reviewCount || 0} size="sm" className="mt-3" />

              <span className={`mt-4 ${doctor?.isVerified ? 'badge-success' : 'badge-warning'}`}>
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {doctor?.isVerified ? 'Verified profile' : 'Awaiting verification'}
              </span>
            </div>

            {!doctor?.isVerified && (
              <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-3 text-left text-xs leading-relaxed text-amber-800">
                Your profile is not yet listed publicly. An administrator will review and verify it
                shortly.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
