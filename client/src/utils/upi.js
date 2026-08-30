import { UPI_PAYEE } from './constants'

/**
 * UPI deep links.
 *
 * This deployment simulates settlement rather than calling a payment gateway,
 * but the link itself is built to the real UPI spec so a scanned QR opens a
 * genuine payment request in the patient's banking app.
 *
 * Spec: upi://pay?pa=<vpa>&pn=<payee>&am=<amount>&cu=INR&tn=<note>&tr=<ref>
 */

/** Per-app deep link schemes, so a patient can jump straight into one app. */
const APP_SCHEMES = {
  gpay: 'tez://upi/pay',
  phonepe: 'phonepe://pay',
  paytm: 'paytmmp://pay',
}

/**
 * Build a UPI payment URI.
 * `amount` is rendered with two decimals because several apps reject
 * an amount that is not formatted that way.
 */
export function buildUpiUri({ amount, note, reference, app } = {}) {
  const params = new URLSearchParams({
    pa: UPI_PAYEE.vpa,
    pn: UPI_PAYEE.name,
    am: Number(amount || 0).toFixed(2),
    cu: 'INR',
  })

  if (note) params.set('tn', note)
  if (reference) params.set('tr', reference)

  const base = APP_SCHEMES[app] || 'upi://pay'
  return `${base}?${params.toString()}`
}

/**
 * Client-side reference used to label the payment attempt in the UI.
 * The authoritative reference is issued by the server once the booking is
 * created — this one only identifies the attempt while the patient pays.
 */
export function buildAttemptReference() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CCPAY-${random}`
}

/** True on the touch devices where a UPI app deep link can actually open. */
export function supportsUpiApps() {
  if (typeof navigator === 'undefined') return false
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent)
}
