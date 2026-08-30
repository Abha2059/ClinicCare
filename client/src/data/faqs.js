/** FAQ content shared by the homepage accordion and the dedicated /faq page. */
export const HOME_FAQS = [
  {
    question: 'How do I book an appointment on ClinicCare?',
    answer:
      'Search for a doctor by name or browse a specialty, open their profile, then choose an available date and time. Confirm your reason for the visit and submit — you will see an appointment ID on the confirmation screen and the booking will appear in your dashboard.',
  },
  {
    question: 'Do I need an account to book?',
    answer:
      'Yes. A free patient account lets us keep your appointment history in one place, send you confirmation details and allow you to reschedule or cancel. Registering takes less than a minute.',
  },
  {
    question: 'Can I cancel or change an appointment?',
    answer:
      'You can cancel any pending or confirmed appointment from your dashboard while it is still upcoming. To move to a different time, cancel the existing booking and select a new slot from the same doctor.',
  },
  {
    question: 'How are time slots kept accurate?',
    answer:
      'Availability is checked on our servers at the moment you confirm. If someone books the same slot moments before you do, that time is released from your selection and you will be asked to pick another one, so two patients can never hold the same slot.',
  },
  {
    question: 'What is the difference between an in-clinic and an online consultation?',
    answer:
      'An in-clinic visit takes place at the doctor’s practice. An online consultation is conducted remotely at the scheduled time. You choose the type during booking, where the doctor offers both.',
  },
  {
    question: 'Are the doctors on ClinicCare verified?',
    answer:
      'Doctor profiles are reviewed by our team before they become visible in the directory, and verified profiles carry a badge. This demonstration platform uses fictional doctor profiles for illustration.',
  },
]

export const ALL_FAQS = [
  {
    category: 'Booking appointments',
    items: HOME_FAQS.slice(0, 5),
  },
  {
    category: 'Accounts & profile',
    items: [
      {
        question: 'How do I update my personal details?',
        answer:
          'Open your dashboard and go to Profile. You can update your name, phone number and profile photo at any time. Your email address is used to sign in and is shown on your appointments.',
      },
      {
        question: 'How do I change my password?',
        answer:
          'Go to Dashboard → Settings and use the Change password form. You will need your current password to set a new one. Passwords must be at least 8 characters and include a letter and a number.',
      },
      {
        question: 'I forgot my password. What now?',
        answer:
          'Select “Forgot password” on the login screen and enter your registered email address. We generate a secure, time-limited reset link so you can set a new password without exposing the old one.',
      },
      {
        question: 'Can I register as a doctor?',
        answer:
          'Doctor accounts are created and verified by the ClinicCare team so that every profile in the directory is reviewed. Contact us through the Contact page and our team will guide you through onboarding.',
      },
    ],
  },
  {
    category: 'Consultations & fees',
    items: [
      {
        question: 'What does the consultation fee cover?',
        answer:
          'The fee shown on a doctor’s profile is for a single consultation with that doctor. Any investigations, procedures or follow-up visits the doctor recommends are charged separately by the clinic.',
      },
      {
        question: 'When do I pay?',
        answer:
          'Payment is handled directly with the clinic at the time of your visit. ClinicCare displays the consultation fee transparently so there are no surprises when you arrive.',
      },
      {
        question: 'Can I leave a review?',
        answer:
          'Once an appointment is marked completed, you can rate your doctor and leave a short comment from the appointment details page. Reviews help other patients choose the right care.',
      },
    ],
  },
  {
    category: 'Privacy & safety',
    items: [
      {
        question: 'How is my information protected?',
        answer:
          'Accounts are protected with encrypted password hashing and token-based authentication. Appointment records are only visible to you, the doctor you booked with, and platform administrators.',
      },
      {
        question: 'Is ClinicCare a substitute for medical advice?',
        answer:
          'No. ClinicCare helps you find doctors and manage appointments. Information on the platform is general in nature and is not a diagnosis or treatment plan. Always follow the guidance of a qualified clinician.',
      },
      {
        question: 'What should I do in an emergency?',
        answer:
          'Do not use ClinicCare for emergencies. If you or someone else is experiencing a medical emergency, contact your local emergency services or go to the nearest emergency department immediately.',
      },
    ],
  },
]

export default HOME_FAQS
