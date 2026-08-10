export const BRAND = {
  name: 'ClinicCare',
  tagline: 'Better Care. Better Health.',
  supportEmail: 'support@cliniccare.example',
  supportPhone: '+91 1800 000 111',
  address: '4th Floor, Meridian Tower, Sector 21, Bengaluru 560001',
}

export const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
}

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
}

export const STATUS_META = {
  pending: { label: 'Pending', className: 'badge-warning' },
  confirmed: { label: 'Confirmed', className: 'badge-success' },
  completed: { label: 'Completed', className: 'badge-info' },
  cancelled: { label: 'Cancelled', className: 'badge-neutral' },
  rejected: { label: 'Rejected', className: 'badge-danger' },
}

export const APPOINTMENT_TYPES = [
  { value: 'in-clinic', label: 'In-clinic visit' },
  { value: 'online', label: 'Online consultation' },
]

export const WEEKDAYS = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
]

export const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Bengali', 'Marathi', 'Tamil', 'Telugu',
  'Kannada', 'Malayalam', 'Gujarati', 'Punjabi', 'Urdu', 'Odia',
]

export const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'experience', label: 'Most experienced' },
  { value: 'fee_low', label: 'Fee: low to high' },
  { value: 'fee_high', label: 'Fee: high to low' },
]

export const EXPERIENCE_FILTERS = [
  { value: '', label: 'Any experience' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
  { value: '15', label: '15+ years' },
]

export const RATING_FILTERS = [
  { value: '', label: 'Any rating' },
  { value: '4.5', label: '4.5+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '3.5', label: '3.5+ stars' },
]

export const PAGE_SIZE = 9

/** Popular conditions surfaced on the homepage and FAQ. */
export const POPULAR_CONDITIONS = [
  { name: 'Fever', specialty: 'general-health' },
  { name: 'Cough & Cold', specialty: 'general-health' },
  { name: 'Back Pain', specialty: 'bone-and-joint-health' },
  { name: 'Indigestion', specialty: 'digestive-and-liver-health' },
  { name: 'Skin Problems', specialty: 'skin-and-hair-health' },
  { name: 'Diabetes', specialty: 'blood-sugar-health' },
  { name: 'Blood Pressure', specialty: 'heart-health' },
  { name: 'Hair Problems', specialty: 'skin-and-hair-health' },
  { name: 'Joint Pain', specialty: 'bone-and-joint-health' },
  { name: "Women's Health", specialty: 'womens-health' },
  { name: 'Child Vaccination', specialty: 'child-care' },
  { name: 'Toothache', specialty: 'dental-health' },
  { name: 'Eye Irritation', specialty: 'eye-care' },
  { name: 'Ear Pain', specialty: 'ent' },
  { name: 'Breathing Difficulty', specialty: 'breathing-and-lung-health' },
  { name: 'Kidney Stones', specialty: 'kidney-care' },
  { name: 'Weight Management', specialty: 'weight-management' },
  { name: 'Chronic Pain', specialty: 'pain-management' },
  { name: 'Elderly Care', specialty: 'elder-care' },
  { name: 'Thyroid Concerns', specialty: 'general-health' },
]
