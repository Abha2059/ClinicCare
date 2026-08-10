import mongoose from 'mongoose'

export const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
]

/** Statuses that still occupy the doctor's slot. */
export const BLOCKING_STATUSES = ['pending', 'confirmed', 'completed']

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true,
    },
    specialty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
    },
    /** Calendar date as YYYY-MM-DD — stored as a string so a slot is
     *  timezone-independent and can be uniquely indexed with the time. */
    appointmentDate: {
      type: String,
      required: [true, 'Appointment date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
      index: true,
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'],
    },
    appointmentType: {
      type: String,
      enum: ['in-clinic', 'online'],
      default: 'in-clinic',
    },
    reason: {
      type: String,
      required: [true, 'A reason for the visit is required'],
      trim: true,
      maxlength: [200, 'Reason must be under 200 characters'],
    },
    symptoms: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Symptoms must be under 500 characters'],
    },
    patientPhone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Enter a valid 10-digit phone number'],
    },
    /** Fee captured at booking time so later price changes don't rewrite history. */
    consultationFee: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: { values: APPOINTMENT_STATUSES, message: 'Invalid appointment status' },
      default: 'pending',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [200, 'Reason must be under 200 characters'],
    },
    /** Set when a patient publishes a review for this visit. */
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v
        return ret
      },
    },
  },
)

/**
 * The double-booking guarantee.
 *
 * A partial unique index over (doctor, date, time) restricted to the statuses
 * that actually occupy the slot. Two concurrent bookings for the same slot make
 * the second write fail with duplicate-key error 11000 at the database level —
 * so the guarantee holds even under a race that slips past the read-time check.
 * Cancelled and rejected appointments are excluded, which frees the slot again.
 */
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: BLOCKING_STATUSES } },
    name: 'unique_active_slot_per_doctor',
  },
)

// Common dashboard queries.
appointmentSchema.index({ patient: 1, appointmentDate: -1 })
appointmentSchema.index({ doctor: 1, appointmentDate: -1 })

export default mongoose.model('Appointment', appointmentSchema)
