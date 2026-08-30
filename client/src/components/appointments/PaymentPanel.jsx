import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import {
  BadgeCheck,
  Building2,
  Check,
  Copy,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react'

import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHODS, UPI_APPS, UPI_PAYEE } from '../../utils/constants'
import { cn, formatCurrency } from '../../utils/helpers'
import { buildUpiUri, supportsUpiApps } from '../../utils/upi'

/**
 * Payment step of the booking flow.
 *
 * Offers the two ways a patient can settle the consultation fee: at the clinic
 * desk, or online by UPI. The UPI branch renders a scannable QR encoding a
 * real `upi://pay` request, plus app deep links on mobile.
 *
 * Settlement is simulated — no gateway is configured — so the patient marks
 * the payment complete themselves. The server is what actually records the
 * payment state when the booking is submitted.
 */
export default function PaymentPanel({
  method,
  onMethodChange,
  amount,
  reference,
  note,
  paid,
  onPaidChange,
}) {
  const isUpi = method === PAYMENT_METHODS.UPI

  return (
    <div>
      <h2 className="text-lg font-semibold text-ink-900">How would you like to pay?</h2>
      <p className="mt-1 text-sm text-ink-500">
        Choose to settle the {formatCurrency(amount)} consultation fee now, or at the clinic.
      </p>

      <fieldset className="mt-5">
        <legend className="sr-only">Payment method</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHOD_OPTIONS.map((option) => {
            const selected = method === option.value
            const OptionIcon = option.value === PAYMENT_METHODS.UPI ? Smartphone : Building2

            return (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-500/20'
                    : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/40',
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={selected}
                  onChange={(e) => onMethodChange(e.target.value)}
                  className="sr-only"
                />
                <OptionIcon
                  className={cn('mt-0.5 h-5 w-5 shrink-0', selected ? 'text-brand-600' : 'text-ink-400')}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      selected ? 'text-brand-800' : 'text-ink-800',
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                    {option.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {isUpi ? (
        <UpiCheckout
          amount={amount}
          reference={reference}
          note={note}
          paid={paid}
          onPaidChange={onPaidChange}
        />
      ) : (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-ink-100 bg-ink-50/70 p-4">
          <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" aria-hidden="true" />
          <div className="text-sm text-ink-600">
            <p className="font-medium text-ink-800">Pay {formatCurrency(amount)} at the clinic</p>
            <p className="mt-1 leading-relaxed">
              The reception desk accepts cash, card and UPI. Your slot is held as soon as this
              booking is confirmed — no payment is needed now.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** QR code, deep links and the confirmation control for the UPI branch. */
function UpiCheckout({ amount, reference, note, paid, onPaidChange }) {
  const [qr, setQr] = useState({ src: '', loading: true, error: null })
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef(null)

  const upiUri = buildUpiUri({ amount, note, reference })
  const showAppLinks = supportsUpiApps()

  // Render the QR whenever the payment request changes.
  useEffect(() => {
    let cancelled = false
    setQr((prev) => ({ ...prev, loading: true, error: null }))

    QRCode.toDataURL(upiUri, {
      width: 480,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1c2534', light: '#ffffff' },
    })
      .then((src) => {
        if (!cancelled) setQr({ src, loading: false, error: null })
      })
      .catch(() => {
        if (!cancelled) {
          setQr({ src: '', loading: false, error: 'The QR code could not be generated.' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [upiUri])

  // Clear a pending "copied" reset if the component goes away first.
  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current)
    },
    [],
  )

  const copyVpa = async () => {
    try {
      await navigator.clipboard.writeText(UPI_PAYEE.vpa)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the UPI ID is displayed for manual entry anyway */
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-ink-100">
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-4 py-3">
        <QrCode className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ink-900">Pay by UPI</h3>
        <span className="ml-auto text-sm font-bold text-ink-900">{formatCurrency(amount)}</span>
      </div>

      <div className="grid gap-6 p-4 sm:p-5 md:grid-cols-[auto_1fr]">
        {/* ---------- QR ---------- */}
        <div className="mx-auto w-full max-w-[13rem] md:mx-0">
          <div className="flex aspect-square items-center justify-center rounded-2xl border border-ink-100 bg-white p-3">
            {qr.loading && (
              <Loader2 className="h-7 w-7 animate-spin text-ink-300" aria-hidden="true" />
            )}
            {qr.error && <p className="px-2 text-center text-xs text-red-600">{qr.error}</p>}
            {qr.src && (
              <img
                src={qr.src}
                alt={`UPI QR code to pay ${formatCurrency(amount)} to ${UPI_PAYEE.vpa}`}
                className="h-full w-full rounded-lg"
              />
            )}
          </div>
          <p className="mt-2.5 text-center text-xs text-ink-500">
            Scan with any UPI app
          </p>
        </div>

        {/* ---------- Details ---------- */}
        <div className="min-w-0">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-ink-500">Pay to</dt>
              <dd className="mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold text-ink-900">
                  {UPI_PAYEE.vpa}
                </span>
                <button
                  type="button"
                  onClick={copyVpa}
                  className="btn-ghost btn-sm"
                  aria-label={`Copy UPI ID ${UPI_PAYEE.vpa}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      Copy
                    </>
                  )}
                </button>
              </dd>
              <dd className="text-xs text-ink-500">{UPI_PAYEE.name}</dd>
            </div>

            <div>
              <dt className="text-xs text-ink-500">Payment reference</dt>
              <dd className="mt-0.5 font-mono text-sm font-medium text-ink-900">{reference}</dd>
            </div>
          </dl>

          {showAppLinks && (
            <div className="mt-4">
              <p className="text-xs text-ink-500">Or open an app</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {UPI_APPS.map((app) => (
                  <a
                    key={app.key}
                    href={buildUpiUri({ amount, note, reference, app: app.key })}
                    className="btn-outline btn-sm"
                  >
                    {app.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            <span>
              ClinicCare never sees your UPI PIN. It is entered only inside your own banking app.
            </span>
          </p>
        </div>
      </div>

      {/* ---------- Confirmation ---------- */}
      <div className="border-t border-ink-100 bg-ink-50/50 px-4 py-4 sm:px-5">
        <label
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition',
            paid
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-ink-200 bg-surface-raised hover:border-brand-300',
          )}
        >
          <input
            type="checkbox"
            checked={paid}
            onChange={(e) => onPaidChange(e.target.checked)}
            className="checkbox mt-0.5"
          />
          <span className="min-w-0">
            <span
              className={cn(
                'flex items-center gap-1.5 text-sm font-semibold',
                paid ? 'text-emerald-800' : 'text-ink-800',
              )}
            >
              {paid && <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />}
              I have completed this payment
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
              Tick this once your UPI app confirms the transfer. The clinic verifies every online
              payment against this reference before your visit.
            </span>
          </span>
        </label>
      </div>
    </div>
  )
}
