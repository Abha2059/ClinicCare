import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
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
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'A rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Comment must be under 500 characters'],
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

// One review per appointment — prevents a patient reviewing the same visit twice.
reviewSchema.index({ appointment: 1 }, { unique: true })

/**
 * Recompute a doctor's average rating and review count from the reviews
 * themselves, so the denormalised fields can never drift.
 */
reviewSchema.statics.syncDoctorRating = async function syncDoctorRating(doctorId) {
  const [result] = await this.aggregate([
    { $match: { doctor: new mongoose.Types.ObjectId(String(doctorId)) } },
    {
      $group: {
        _id: '$doctor',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])

  const Doctor = mongoose.model('Doctor')
  await Doctor.findByIdAndUpdate(doctorId, {
    // Round to one decimal so the stored value matches what the UI displays.
    rating: result ? Math.round(result.average * 10) / 10 : 0,
    reviewCount: result ? result.count : 0,
  })
}

// Keep the doctor's aggregate rating current on write and delete.
reviewSchema.post('save', async function afterSave() {
  await this.constructor.syncDoctorRating(this.doctor)
})

reviewSchema.post('findOneAndDelete', async function afterDelete(doc) {
  if (doc) await mongoose.model('Review').syncDoctorRating(doc.doctor)
})

export default mongoose.model('Review', reviewSchema)
