import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react'

import Breadcrumbs from '../../components/common/Breadcrumbs'
import { Input, Textarea } from '../../components/forms/FormField'
import { useToast } from '../../context/AppContext'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import { BRAND } from '../../utils/constants'
import { rules } from '../../utils/validators'

const CONTACT_DETAILS = [
  {
    icon: Phone,
    label: 'Call us',
    value: BRAND.supportPhone,
    href: `tel:${BRAND.supportPhone.replace(/\s/g, '')}`,
    hint: 'Monday to Saturday, 9:00 AM – 7:00 PM',
  },
  {
    icon: Mail,
    label: 'Email us',
    value: BRAND.supportEmail,
    href: `mailto:${BRAND.supportEmail}`,
    hint: 'We reply within one working day',
  },
  {
    icon: MapPin,
    label: 'Visit us',
    value: BRAND.address,
    hint: 'Reception open on weekdays',
  },
]

const SUBJECTS = [
  'Booking an appointment',
  'Changing or cancelling a visit',
  'Account or login help',
  'Doctor onboarding enquiry',
  'Feedback or a complaint',
  'Something else',
]

export default function Contact() {
  useDocumentTitle('Contact')
  const toast = useToast()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' },
  })

  const onSubmit = async (values) => {
    // This demonstration platform has no outbound mail service. The submission is
    // validated and acknowledged locally so the form is never a dead end.
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSent(true)
    toast.success('Thanks — your message has been received.')
    reset({ ...values, message: '' })
  }

  return (
    <>
      <section className="hero-gradient border-b border-ink-100">
        <div className="container-app py-10 lg:py-12">
          <Breadcrumbs items={[{ label: 'Contact' }]} />
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold sm:text-4xl">We are here to help</h1>
            <p className="mt-3 text-lg text-ink-600">
              Questions about a booking, your account or joining {BRAND.name} as a clinician? Send us
              a message and our team will get back to you.
            </p>
          </div>
        </div>
      </section>

      <div className="container-app section">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
          {/* ---------- Form ---------- */}
          <section aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="text-xl font-bold sm:text-2xl">
              Send us a message
            </h2>
            <p className="mt-1.5 text-ink-600">
              Fill in the form below — all fields marked with an asterisk are required.
            </p>

            {sent && (
              <div
                role="status"
                className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-emerald-900">Message received</p>
                  <p className="mt-0.5 text-sm text-emerald-800">
                    Thanks for reaching out. Our support team will respond within one working day.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="card card-body mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  required
                  placeholder="Your name"
                  error={errors.name?.message}
                  {...register('name', rules.name)}
                />
                <Input
                  label="Email address"
                  type="email"
                  required
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  {...register('email', rules.email)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Phone number"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number (optional)"
                  error={errors.phone?.message}
                  {...register('phone', rules.optionalPhone)}
                />
                <div>
                  <label htmlFor="subject" className="label">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <select id="subject" className="select" {...register('subject', rules.required('Subject'))}>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Textarea
                label="Message"
                required
                rows={6}
                placeholder="Tell us how we can help…"
                error={errors.message?.message}
                {...register('message', {
                  required: 'Please write a message',
                  minLength: { value: 15, message: 'Please give us a little more detail (15+ characters)' },
                  maxLength: { value: 1000, message: 'Message must be under 1000 characters' },
                })}
              />

              <div className="flex flex-col gap-3 border-t border-ink-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-400">
                  We use your details only to respond to this enquiry.
                </p>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {isSubmitting ? 'Sending…' : 'Send message'}
                </button>
              </div>
            </form>
          </section>

          {/* ---------- Details ---------- */}
          <aside className="space-y-4">
            <h2 className="text-xl font-bold">Other ways to reach us</h2>

            {CONTACT_DETAILS.map((item) => (
              <div key={item.label} className="card card-body">
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="mt-0.5 block break-words text-sm text-brand-700 hover:underline">
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 break-words text-sm text-ink-600">{item.value}</p>
                    )}
                    <p className="mt-1 text-xs text-ink-400">{item.hint}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="card card-body bg-ink-900 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-400">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3.5 text-base font-semibold text-white">Support hours</h3>
              <dl className="mt-3 space-y-1.5 text-sm text-ink-300">
                <div className="flex justify-between gap-3">
                  <dt>Monday – Friday</dt>
                  <dd>9:00 AM – 7:00 PM</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Saturday</dt>
                  <dd>10:00 AM – 4:00 PM</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Sunday</dt>
                  <dd>Closed</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-red-900">
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Medical emergency?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-red-800">
                Do not use this form. Contact your local emergency services or go to the nearest
                emergency department immediately.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
