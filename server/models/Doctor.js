import mongoose from 'mongoose'

export const WEEKDAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]

const daySchema = new mongoose.Schema(
  {
    isWorking: { type: Boolean, default: false },
    startTime: {
      type: String,
      default: '09:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'],
    },
    endTime: {
      type: String,
      default: '17:00',
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:MM format'],
    },
  },
  { _id: false },
)

/** Default Monday–Friday 09:00–17:00, weekend off. */
function defaultAvailability() {
  return WEEKDAY_KEYS.reduce((acc, key) => {
    const isWeekend = key === 'saturday' || key === 'sunday'
    acc[key] = { isWorking: !isWeekend, startTime: '09:00', endTime: '17:00' }
    return acc
  }, {})
}

const availabilitySchema = new mongoose.Schema(
  WEEKDAY_KEYS.reduce((acc, key) => {
    acc[key] = { type: daySchema, default: () => ({}) }
    return acc
  }, {}),
  { _id: false },
)

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    specialty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Specialty',
      required: [true, 'Specialty is required'],
      index: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
      maxlength: [160, 'Qualification must be under 160 characters'],
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [70, 'Please enter a realistic value'],
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Bio must be under 1000 characters'],
    },
    expertise: {
      type: [String],
      default: [],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    availability: {
      type: availabilitySchema,
      default: defaultAvailability,
    },
    /** Length of each bookable slot, in minutes. */
    slotDuration: {
      type: Number,
      default: 30,
      min: [10, 'Slots must be at least 10 minutes'],
      max: [120, 'Slots must be 120 minutes or less'],
    },
    /** Specific dates (YYYY-MM-DD) the doctor is not consulting. */
    unavailableDates: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
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

// Supports the directory's common filter/sort combinations.
doctorSchema.index({ specialty: 1, isVerified: 1 })
doctorSchema.index({ rating: -1 })
doctorSchema.index({ consultationFee: 1 })

/**
 * Every slot this doctor consults in on a given weekday.
 * Returns [] when the day is not a working day.
 */
doctorSchema.methods.getSlotsForWeekday = function getSlotsForWeekday(weekdayKey) {
  const day = this.availability?.[weekdayKey]
  if (!day?.isWorking || !day.startTime || !day.endTime) return []

  const toMinutes = (t) => {
    const [h, m] = String(t).split(':').map(Number)
    return h * 60 + m
  }
  const toTime = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

  const start = toMinutes(day.startTime)
  const end = toMinutes(day.endTime)
  const step = this.slotDuration || 30
  if (!(end > start)) return []

  const slots = []
  // A slot must fit entirely inside the consulting window.
  for (let t = start; t + step <= end; t += step) {
    slots.push(toTime(t))
  }
  return slots
}

export default mongoose.model('Doctor', doctorSchema)
