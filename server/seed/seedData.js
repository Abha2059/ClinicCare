/**
 * ClinicCare database seed.
 *
 * Usage:  npm run seed          (from the server directory)
 *
 * Wipes the ClinicCare collections and repopulates them with demonstration
 * data: specialties, doctors, patients, appointments and reviews.
 * Every person in this data set is fictional.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

import connectDB from '../config/db.js'
import User from '../models/User.js'
import Doctor, { WEEKDAY_KEYS } from '../models/Doctor.js'
import Specialty from '../models/Specialty.js'
import Appointment from '../models/Appointment.js'
import Review from '../models/Review.js'

import specialtyData from './specialties.js'
import doctorData from './doctors.js'

const DEMO_PASSWORD = 'Password123'

const PATIENTS = [
  { name: 'Aarav Sharma', email: 'patient@cliniccare.com', phone: '9900000001' },
  { name: 'Isha Kapoor', email: 'isha.kapoor@example.com', phone: '9900000002' },
  { name: 'Rahul Menon', email: 'rahul.menon@example.com', phone: '9900000003' },
  { name: 'Divya Reddy', email: 'divya.reddy@example.com', phone: '9900000004' },
  { name: 'Karan Singh', email: 'karan.singh@example.com', phone: '9900000005' },
  { name: 'Nisha Patel', email: 'nisha.patel@example.com', phone: '9900000006' },
]

const REASONS = [
  'Persistent cough for two weeks',
  'Routine blood pressure review',
  'Follow-up on recent blood tests',
  'Lower back pain after lifting',
  'Recurring headaches in the evening',
  'Annual health check-up',
  'Skin rash that is not settling',
  'Review of ongoing medication',
  'Joint stiffness in the morning',
  'Digestive discomfort after meals',
]

const REVIEW_COMMENTS = [
  'Listened carefully and explained the plan clearly. I left knowing exactly what to do next.',
  'Very thorough consultation and never felt rushed. Would happily book again.',
  'Practical advice without unnecessary tests. Appreciated the honesty.',
  'Took time to answer every question. The follow-up instructions were easy to understand.',
  'Professional and reassuring throughout. Booking through ClinicCare was straightforward.',
  'Clear explanation of my options and what each one actually involves.',
]

/** Date key N days from today, in local time. */
function dateKey(offsetDays = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function weekdayKeyFor(key) {
  const [y, m, d] = key.split('-').map(Number)
  return WEEKDAY_KEYS[(new Date(y, m - 1, d).getDay() + 6) % 7]
}

function pick(list, index) {
  return list[index % list.length]
}

async function seed() {
  await connectDB()

  console.log('\n[seed] Clearing existing ClinicCare data…')
  await Promise.all([
    Review.deleteMany({}),
    Appointment.deleteMany({}),
    Doctor.deleteMany({}),
    Specialty.deleteMany({}),
    User.deleteMany({}),
  ])

  // Drop stale indexes so schema changes (like the partial slot index) apply cleanly.
  try {
    await Appointment.collection.dropIndexes()
  } catch {
    /* no indexes yet on a fresh database */
  }
  await Appointment.syncIndexes()

  // ---------- Specialties ----------
  const specialties = await Specialty.create(specialtyData)
  console.log(`[seed] Created ${specialties.length} specialties`)
  const specialtyByName = new Map(specialties.map((s) => [s.name, s]))

  // ---------- Admin ----------
  const admin = await User.create({
    name: 'ClinicCare Admin',
    email: 'cliniccare26@gmail.com',
    phone: '9700000001',
    password: DEMO_PASSWORD,
    role: 'admin',
  })
  console.log('[seed] Created 1 administrator')

  // ---------- Doctors ----------
  const doctors = []
  for (const [index, entry] of doctorData.entries()) {
    const specialty = specialtyByName.get(entry.specialtyName)
    if (!specialty) {
      throw new Error(`Seed error: unknown specialty "${entry.specialtyName}"`)
    }

    const user = await User.create({
      name: entry.name,
      // The first doctor doubles as the demo login.
      email: index === 0 ? 'doctor@cliniccare.com' : entry.email,
      phone: entry.phone,
      password: DEMO_PASSWORD,
      role: 'doctor',
      profileImage: entry.profileImage || '',
    })

    // Vary the working week a little so availability is not uniform.
    const availability = WEEKDAY_KEYS.reduce((acc, key) => {
      const isSunday = key === 'sunday'
      const isSaturday = key === 'saturday'
      acc[key] = {
        isWorking: !isSunday && !(isSaturday && index % 2 === 0),
        startTime: index % 3 === 0 ? '10:00' : '09:00',
        endTime: index % 3 === 0 ? '18:00' : '17:00',
      }
      return acc
    }, {})

    const doctor = await Doctor.create({
      user: user._id,
      specialty: specialty._id,
      qualification: entry.qualification,
      location: entry.location,
      experience: entry.experience,
      consultationFee: entry.consultationFee,
      languages: entry.languages,
      expertise: entry.expertise,
      bio: entry.bio,
      availability,
      slotDuration: entry.slotDuration || 30,
      isVerified: true,
    })

    doctors.push({ doctor, user, seedRating: entry.rating })
  }
  console.log(`[seed] Created ${doctors.length} verified doctors`)

  // ---------- Patients ----------
  const patients = []
  for (const entry of PATIENTS) {
    patients.push(
      await User.create({
        name: entry.name,
        email: entry.email,
        phone: entry.phone,
        password: DEMO_PASSWORD,
        role: 'patient',
      }),
    )
  }
  console.log(`[seed] Created ${patients.length} patients`)

  // ---------- Appointments ----------
  // A slot is only used once per doctor, so the unique index is never violated.
  const used = new Set()
  const appointments = []

  /** Find a real, free slot for this doctor on the given day offset. */
  const findSlot = (doctor, offset) => {
    const key = dateKey(offset)
    if ((doctor.unavailableDates || []).includes(key)) return null
    const slots = doctor.getSlotsForWeekday(weekdayKeyFor(key))
    for (const time of slots) {
      const id = `${doctor._id}|${key}|${time}`
      if (!used.has(id)) {
        used.add(id)
        return { date: key, time }
      }
    }
    return null
  }

  // Past, completed appointments — these are what reviews attach to.
  let counter = 0
  for (let i = 0; i < 12; i += 1) {
    const { doctor } = doctors[i % doctors.length]
    const patient = pick(patients, i)
    const slot = findSlot(doctor, -(7 + (i % 20)))
    if (!slot) continue

    appointments.push({
      patient: patient._id,
      doctor: doctor._id,
      specialty: doctor.specialty,
      appointmentDate: slot.date,
      appointmentTime: slot.time,
      appointmentType: i % 3 === 0 ? 'online' : 'in-clinic',
      reason: pick(REASONS, counter),
      symptoms: '',
      patientPhone: patient.phone,
      consultationFee: doctor.consultationFee,
      status: 'completed',
    })
    counter += 1
  }

  // Upcoming appointments across pending and confirmed.
  for (let i = 0; i < 10; i += 1) {
    const { doctor } = doctors[(i + 3) % doctors.length]
    const patient = pick(patients, i + 2)
    const slot = findSlot(doctor, 1 + (i % 12))
    if (!slot) continue

    appointments.push({
      patient: patient._id,
      doctor: doctor._id,
      specialty: doctor.specialty,
      appointmentDate: slot.date,
      appointmentTime: slot.time,
      appointmentType: i % 4 === 0 ? 'online' : 'in-clinic',
      reason: pick(REASONS, counter),
      symptoms: i % 3 === 0 ? 'Symptoms have been gradually worsening over the past week.' : '',
      patientPhone: patient.phone,
      consultationFee: doctor.consultationFee,
      status: i % 2 === 0 ? 'confirmed' : 'pending',
    })
    counter += 1
  }

  // A couple of cancelled visits so every status appears in the UI.
  for (let i = 0; i < 2; i += 1) {
    const { doctor } = doctors[(i + 7) % doctors.length]
    const patient = pick(patients, i + 4)
    const slot = findSlot(doctor, -(2 + i))
    if (!slot) continue

    appointments.push({
      patient: patient._id,
      doctor: doctor._id,
      specialty: doctor.specialty,
      appointmentDate: slot.date,
      appointmentTime: slot.time,
      appointmentType: 'in-clinic',
      reason: pick(REASONS, counter),
      patientPhone: patient.phone,
      consultationFee: doctor.consultationFee,
      status: 'cancelled',
      cancellationReason: 'Cancelled by patient',
    })
    counter += 1
  }

  const createdAppointments = await Appointment.insertMany(appointments)
  console.log(`[seed] Created ${createdAppointments.length} appointments`)

  // ---------- Reviews ----------
  const completed = createdAppointments.filter((a) => a.status === 'completed')
  const reviews = completed.slice(0, 10).map((appointment, i) => ({
    patient: appointment.patient,
    doctor: appointment.doctor,
    appointment: appointment._id,
    rating: [5, 5, 4, 5, 4, 5, 4, 5, 3, 5][i % 10],
    comment: pick(REVIEW_COMMENTS, i),
  }))

  const createdReviews = await Review.insertMany(reviews)
  await Appointment.updateMany(
    { _id: { $in: createdReviews.map((r) => r.appointment) } },
    { isReviewed: true },
  )
  console.log(`[seed] Created ${createdReviews.length} reviews`)

  // insertMany bypasses the post-save hook, so recompute ratings explicitly.
  const reviewedDoctorIds = [...new Set(createdReviews.map((r) => String(r.doctor)))]
  for (const id of reviewedDoctorIds) {
    await Review.syncDoctorRating(id)
  }

  // Doctors without reviews keep their seeded headline rating so the
  // directory does not look empty.
  for (const { doctor, seedRating } of doctors) {
    if (!reviewedDoctorIds.includes(String(doctor._id))) {
      await Doctor.findByIdAndUpdate(doctor._id, { rating: seedRating, reviewCount: 0 })
    }
  }
  console.log('[seed] Recalculated doctor ratings')

  console.log(`
────────────────────────────────────────────────
  ClinicCare database seeded successfully
────────────────────────────────────────────────
  Specialties   ${specialties.length}
  Doctors       ${doctors.length}
  Patients      ${patients.length}
  Admins        1
  Appointments  ${createdAppointments.length}
  Reviews       ${createdReviews.length}

  Demo accounts (password: ${DEMO_PASSWORD})
    Patient   patient@cliniccare.com
    Doctor    doctor@cliniccare.com
    Admin     ${admin.email}
────────────────────────────────────────────────
`)

  await mongoose.connection.close()
  process.exit(0)
}

seed().catch(async (error) => {
  console.error('\n[seed] Failed:', error.message)
  console.error(error)
  await mongoose.connection.close().catch(() => {})
  process.exit(1)
})
