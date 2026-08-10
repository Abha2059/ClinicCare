import mongoose from 'mongoose'

/** URL-safe slug: "Skin and Hair Health" -> "skin-and-hair-health". */
export function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const specialtySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Specialty name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'Name must be under 80 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description must be under 500 characters'],
    },
    conditions: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: '',
      trim: true,
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

// Keep the slug (and icon default) in step with the name.
specialtySchema.pre('validate', function setSlug() {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name)
  }
  if (!this.icon) {
    this.icon = this.slug
  }
})

export default mongoose.model('Specialty', specialtySchema)
