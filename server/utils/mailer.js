/**
 * Outbound email for appointment lifecycle events.
 *
 * Credentials come from .env (EMAIL_USER + EMAIL_PASS, a Gmail app password).
 * When they are absent the mailer logs what it would have sent and moves on,
 * so bookings never fail because email is not set up yet. Sending is
 * fire-and-forget for the same reason: a slow SMTP server must not hold up
 * an API response, and a failed send must not roll back a booking.
 */
import nodemailer from 'nodemailer'

const BRAND = 'ClinicCare'
const BRAND_COLOR = '#1fa68a'

let transporter = null

function isConfigured() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS)
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  }
  return transporter
}

/** '2026-08-24' → 'Monday, 24 August 2026' (kept as a plain calendar date). */
function formatDate(dateKey) {
  const [y, m, d] = String(dateKey).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** '14:30' → '2:30 PM'. */
function formatTime(time) {
  const [h, min] = String(time).split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(min).padStart(2, '0')} ${suffix}`
}

function detailRows(appointment) {
  const doctorName = appointment.doctor?.user?.name || 'your doctor'
  const specialty =
    appointment.specialty?.name || appointment.doctor?.specialty?.name || ''
  const rows = [
    ['Doctor', doctorName],
    specialty && ['Specialty', specialty],
    ['Date', formatDate(appointment.appointmentDate)],
    ['Time', formatTime(appointment.appointmentTime)],
    ['Visit type', appointment.appointmentType === 'online' ? 'Online consultation' : 'In-clinic visit'],
    ['Fee', `₹${appointment.consultationFee}`],
  ].filter(Boolean)

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap;">${label}</td>
          <td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${value}</td>
        </tr>`,
    )
    .join('')
}

function wrap(patientName, heading, intro, appointment, footerNote) {
  return `
  <div style="background:#f3f4f6;padding:24px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <div style="background:${BRAND_COLOR};padding:18px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;">${BRAND}</span>
      </div>
      <div style="padding:28px;">
        <h2 style="margin:0 0 12px;color:#111827;font-size:18px;">${heading}</h2>
        <p style="margin:0 0 18px;color:#374151;font-size:14px;line-height:1.6;">
          Dear ${patientName},<br/>${intro}
        </p>
        <table style="border-collapse:collapse;">${detailRows(appointment)}</table>
        <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">${footerNote}</p>
      </div>
      <div style="padding:14px 28px;background:#f9fafb;color:#9ca3af;font-size:12px;">
        This is an automated message from ${BRAND}. Please do not reply to this email.
      </div>
    </div>
  </div>`
}

const TEMPLATES = {
  submitted: (appointment) => ({
    subject: `${BRAND}: appointment request received — awaiting confirmation`,
    html: wrap(
      appointment.patient?.name || 'Patient',
      'Your appointment request has been submitted',
      'Thank you for booking with ClinicCare. Your appointment request has been received and is <strong>waiting for confirmation from our admin team</strong>. We will let you know as soon as it is reviewed.',
      appointment,
      'You can track the status of this appointment any time from your ClinicCare dashboard.',
    ),
  }),
  completed: (appointment) => ({
    subject: `${BRAND}: your appointment has been completed`,
    html: wrap(
      appointment.patient?.name || 'Patient',
      'Your appointment is complete',
      'Your appointment has been <strong>completed</strong>. Thank you for visiting ClinicCare — we hope the consultation was helpful.',
      appointment,
      'You can leave a review for your doctor from your ClinicCare dashboard. If you need follow-up care, you are welcome to book again.',
    ),
  }),
  adminNewRequest: (appointment) => ({
    subject: `${BRAND}: new appointment request from ${appointment.patient?.name || 'a patient'}`,
    html: wrap(
      'Admin',
      'A new appointment has been requested',
      `<strong>${appointment.patient?.name || 'A patient'}</strong> (${appointment.patient?.email || 'no email'}${appointment.patientPhone ? ', ' + appointment.patientPhone : ''}) has requested an appointment and is waiting for your review.`,
      appointment,
      'Open the admin dashboard to accept or reject this request.',
    ),
  }),
}

/**
 * Send a lifecycle email for a populated appointment. Never throws; failures
 * are logged so the API request that triggered them is unaffected.
 *
 * Recipient defaults to the patient's registered email; pass `to` for mails
 * addressed elsewhere (e.g. the clinic's own inbox).
 */
export function sendAppointmentEmail(kind, appointment, to = appointment?.patient?.email) {
  const build = TEMPLATES[kind]
  if (!build || !to) return

  const { subject, html } = build(appointment)

  if (!isConfigured()) {
    console.log(`[mail] Skipped "${kind}" email to ${to} — EMAIL_USER/EMAIL_PASS not set in .env`)
    return
  }

  // The returned promise lets callers await delivery — required on serverless
  // hosts, which freeze as soon as the response goes out. It still never
  // rejects, so awaiting it cannot fail a booking.
  return getTransporter()
    .sendMail({ from: `"${BRAND}" <${process.env.EMAIL_USER}>`, to, subject, html })
    .then(() => console.log(`[mail] Sent "${kind}" email to ${to}`))
    .catch((err) => console.error(`[mail] Failed to send "${kind}" email to ${to}:`, err.message))
}
