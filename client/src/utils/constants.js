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

/** Where the clinic collects UPI payments. Override with VITE_UPI_ID. */
export const UPI_PAYEE = {
  vpa: import.meta.env.VITE_UPI_ID || 'cliniccare@upi',
  name: import.meta.env.VITE_UPI_NAME || 'ClinicCare',
}

export const PAYMENT_METHODS = {
  PAY_AT_CLINIC: 'pay-at-clinic',
  UPI: 'upi',
}

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: 'pay-at-clinic',
    label: 'Pay at the clinic',
    description: 'Settle the fee by cash or card at the reception desk on the day of your visit.',
  },
  {
    value: 'upi',
    label: 'Pay online with UPI',
    description: 'Scan a QR code or open your UPI app to pay now and arrive settled.',
  },
]

export const PAYMENT_STATUS_META = {
  pending: { label: 'Payment due', className: 'badge-warning' },
  paid: { label: 'Paid online', className: 'badge-success' },
  refunded: { label: 'Refunded', className: 'badge-info' },
}

/** UPI apps offered as one-tap deep links on mobile. */
export const UPI_APPS = [
  { key: 'gpay', label: 'Google Pay' },
  { key: 'phonepe', label: 'PhonePe' },
  { key: 'paytm', label: 'Paytm' },
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
  { name: 'Fever', specialty: 'general-health', image: '/conditions/fever.jpg' },
  { name: 'Cough & Cold', specialty: 'general-health', image: '/conditions/cough-cold.jpg' },
  { name: 'Back Pain', specialty: 'bone-and-joint-health', image: '/conditions/back-pain.jpg' },
  { name: 'Indigestion', specialty: 'digestive-and-liver-health', image: '/conditions/indigestion.jpg' },
  { name: 'Skin Problems', specialty: 'skin-and-hair-health', image: '/conditions/skin-problems.jpg' },
  { name: 'Diabetes', specialty: 'blood-sugar-health', image: '/conditions/diabetes.jpg' },
  { name: 'Blood Pressure', specialty: 'heart-health', image: '/conditions/blood-pressure.jpg' },
  { name: 'Hair Problems', specialty: 'skin-and-hair-health', image: '/conditions/hair-problems.jpg' },
  { name: 'Joint Pain', specialty: 'bone-and-joint-health', image: '/conditions/joint-pain.jpg' },
  { name: "Women's Health", specialty: 'womens-health', image: '/conditions/womens-health.jpg' },
  { name: 'Child Vaccination', specialty: 'child-care', image: '/conditions/child-vaccination.jpg' },
  { name: 'Toothache', specialty: 'dental-health', image: '/conditions/toothache.jpg' },
  { name: 'Eye Irritation', specialty: 'eye-care', image: '/conditions/eye-irritation.jpg' },
  { name: 'Ear Pain', specialty: 'ent', image: '/conditions/ear-pain.jpg' },
  { name: 'Breathing Difficulty', specialty: 'breathing-and-lung-health', image: '/conditions/breathing-difficulty.jpg' },
  { name: 'Kidney Stones', specialty: 'kidney-care', image: '/conditions/kidney-stones.jpg' },
  { name: 'Weight Management', specialty: 'weight-management', image: '/conditions/weight-management.jpg' },
  { name: 'Chronic Pain', specialty: 'pain-management', image: '/conditions/chronic-pain.jpg' },
  { name: 'Elderly Care', specialty: 'elder-care', image: '/conditions/elderly-care.jpg' },
  { name: 'Thyroid Concerns', specialty: 'general-health', image: '/conditions/thyroid.jpg' },
]
