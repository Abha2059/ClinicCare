/**
 * Shared react-hook-form validation rules.
 * Keeping them here guarantees the client mirrors the server-side rules.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const PHONE_PATTERN = /^[0-9]{10}$/

export const rules = {
  name: {
    required: 'Full name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' },
    maxLength: { value: 80, message: 'Name must be under 80 characters' },
  },
  email: {
    required: 'Email address is required',
    pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
  },
  phone: {
    required: 'Phone number is required',
    pattern: { value: PHONE_PATTERN, message: 'Enter a valid 10-digit phone number' },
  },
  optionalPhone: {
    pattern: { value: PHONE_PATTERN, message: 'Enter a valid 10-digit phone number' },
  },
  password: {
    required: 'Password is required',
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    validate: {
      hasLetter: (v) => /[A-Za-z]/.test(v) || 'Include at least one letter',
      hasNumber: (v) => /[0-9]/.test(v) || 'Include at least one number',
    },
  },
  loginPassword: {
    required: 'Password is required',
  },
  required: (label) => ({ required: `${label} is required` }),
}

/** Confirm-password rule bound to the current password value. */
export const confirmPasswordRule = (getPassword) => ({
  required: 'Please confirm your password',
  validate: (value) => value === getPassword() || 'Passwords do not match',
})
