/**
 * ClinicCare API smoke test.
 *
 * Exercises the full request surface against a running server:
 * auth, role authorisation, the doctor directory, the booking flow,
 * double-booking prevention (including a concurrent race), status
 * transitions, reviews and the admin endpoints.
 *
 * Usage:  node seed/apiTest.mjs   (with the API running)
 */
const BASE = process.env.TEST_API_URL || 'http://localhost:5001/api'
const PASSWORD = 'Password123'

let passed = 0
let failed = 0
const failures = []

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1
    console.log(`  \x1b[32m✓\x1b[0m ${name}`)
  } else {
    failed += 1
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
    console.log(`  \x1b[31m✗\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* some responses legitimately have no body */
  }
  return { status: res.status, data }
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}

const run = async () => {
  console.log('\n══════════════════════════════════════════')
  console.log('  ClinicCare API test suite')
  console.log('══════════════════════════════════════════')

  // ---------- Health ----------
  section('Health & public endpoints')
  const health = await api('/health')
  check('GET /health returns 200', health.status === 200)
  check('database is connected', health.data?.database === 'connected')

  const specialties = await api('/specialties')
  check('GET /specialties returns 200', specialties.status === 200)
  check(
    'seeded 17 specialties',
    specialties.data?.specialties?.length === 17,
    `got ${specialties.data?.specialties?.length}`,
  )
  const specialtySlug = specialties.data?.specialties?.[0]?.slug
  check('specialties carry a slug', Boolean(specialtySlug))

  const bySlug = await api(`/specialties/${specialtySlug}`)
  check('GET /specialties/:slug resolves by slug', bySlug.status === 200)

  const doctors = await api('/doctors?limit=50')
  check('GET /doctors returns 200', doctors.status === 200)
  check('15 verified doctors listed', doctors.data?.total === 15, `got ${doctors.data?.total}`)

  const doctorId = doctors.data?.doctors?.[0]?._id
  const doctorDetail = await api(`/doctors/${doctorId}`)
  check('GET /doctors/:id returns the profile', doctorDetail.status === 200)
  check('doctor has a populated user', Boolean(doctorDetail.data?.doctor?.user?.name))
  check('doctor has a populated specialty', Boolean(doctorDetail.data?.doctor?.specialty?.name))

  // Filtering & sorting
  const filtered = await api(`/doctors?specialty=${specialtySlug}`)
  check('filtering by specialty returns 200', filtered.status === 200)
  check(
    'specialty filter narrows results',
    (filtered.data?.total ?? 99) <= 15,
    `got ${filtered.data?.total}`,
  )

  const unknownSpecialty = await api('/doctors?specialty=not-a-real-specialty')
  check(
    'unknown specialty yields zero doctors (not all)',
    unknownSpecialty.data?.total === 0,
    `got ${unknownSpecialty.data?.total}`,
  )

  const sorted = await api('/doctors?sort=fee_low&limit=5')
  const fees = sorted.data?.doctors?.map((d) => d.consultationFee) ?? []
  check(
    'sort=fee_low returns ascending fees',
    fees.every((f, i) => i === 0 || fees[i - 1] <= f),
    fees.join(','),
  )

  const searched = await api('/doctors?search=Cardiology')
  check('search endpoint responds', searched.status === 200)

  // ---------- Auth ----------
  section('Authentication')
  const badLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'patient@cliniccare.com', password: 'WrongPassword1' },
  })
  check('wrong password is rejected with 401', badLogin.status === 401)

  const patientLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'patient@cliniccare.com', password: PASSWORD },
  })
  check('patient login succeeds', patientLogin.status === 200)
  const patientToken = patientLogin.data?.token
  check('login returns a JWT', Boolean(patientToken))
  check('login never leaks the password hash', patientLogin.data?.user?.password === undefined)

  const doctorLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'doctor@cliniccare.com', password: PASSWORD },
  })
  const doctorToken = doctorLogin.data?.token
  check('doctor login succeeds', doctorLogin.status === 200)

  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: 'admin@cliniccare.com', password: PASSWORD },
  })
  const adminToken = adminLogin.data?.token
  check('admin login succeeds', adminLogin.status === 200)

  const me = await api('/auth/me', { token: patientToken })
  check('GET /auth/me returns the session user', me.data?.user?.email === 'patient@cliniccare.com')

  const noToken = await api('/auth/me')
  check('GET /auth/me without a token is 401', noToken.status === 401)

  // Registration always creates a patient
  const uniqueEmail = `test.user.${Date.now()}@example.com`
  const registered = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: uniqueEmail, phone: '9812345678', password: PASSWORD },
  })
  check('registration succeeds', registered.status === 201)
  check('new accounts are always patients', registered.data?.user?.role === 'patient')

  const escalation = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Escalate Me',
      email: `escalate.${Date.now()}@example.com`,
      phone: '9812345679',
      password: PASSWORD,
      role: 'admin', // must be ignored
    },
  })
  check(
    'role cannot be self-assigned at registration',
    escalation.data?.user?.role === 'patient',
    `got ${escalation.data?.user?.role}`,
  )

  const duplicate = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Test User', email: uniqueEmail, phone: '9812345678', password: PASSWORD },
  })
  check('duplicate email is rejected with 409', duplicate.status === 409)

  const weakPassword = await api('/auth/register', {
    method: 'POST',
    body: { name: 'Weak', email: `weak.${Date.now()}@example.com`, phone: '9812345670', password: 'short' },
  })
  check('weak password is rejected with 400', weakPassword.status === 400)

  // ---------- Role authorisation ----------
  section('Role-based authorisation')
  const patientHittingAdmin = await api('/admin/stats', { token: patientToken })
  check('patient cannot reach admin stats (403)', patientHittingAdmin.status === 403)

  const doctorHittingAdmin = await api('/admin/stats', { token: doctorToken })
  check('doctor cannot reach admin stats (403)', doctorHittingAdmin.status === 403)

  const adminStats = await api('/admin/stats', { token: adminToken })
  check('admin can reach admin stats (200)', adminStats.status === 200)

  const patientDoctorArea = await api('/doctors/me/profile', { token: patientToken })
  check('patient cannot read the doctor profile area (403)', patientDoctorArea.status === 403)

  // ---------- Slots ----------
  section('Doctor availability')
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateKey = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-')

  const slots = await api(`/doctors/${doctorId}/slots?date=${dateKey}`)
  check('GET /doctors/:id/slots returns 200', slots.status === 200)
  check('slots carry an availability flag', slots.data?.slots?.every((s) => 'available' in s) ?? false)

  const badDate = await api(`/doctors/${doctorId}/slots?date=not-a-date`)
  check('malformed date is rejected with 400', badDate.status === 400)

  // Pick a doctor and date that actually has a free slot.
  let bookingDoctor = null
  let bookingDate = null
  let freeSlot = null
  outer: for (const d of doctors.data.doctors) {
    for (let offset = 1; offset <= 10; offset += 1) {
      const day = new Date()
      day.setDate(day.getDate() + offset)
      const key = [
        day.getFullYear(),
        String(day.getMonth() + 1).padStart(2, '0'),
        String(day.getDate()).padStart(2, '0'),
      ].join('-')
      const r = await api(`/doctors/${d._id}/slots?date=${key}`)
      const open = r.data?.slots?.find((s) => s.available)
      if (open) {
        bookingDoctor = d._id
        bookingDate = key
        freeSlot = open.time
        break outer
      }
    }
  }
  check('found a bookable slot to test with', Boolean(freeSlot), `${bookingDate} ${freeSlot}`)

  // ---------- Booking ----------
  section('Appointment booking')
  const booking = await api('/appointments', {
    method: 'POST',
    token: patientToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: bookingDate,
      appointmentTime: freeSlot,
      appointmentType: 'in-clinic',
      reason: 'Automated end-to-end test booking',
      patientPhone: '9900000001',
    },
  })
  check('patient can book a free slot (201)', booking.status === 201, JSON.stringify(booking.data?.message))
  const appointmentId = booking.data?.appointment?._id
  check('booking returns an appointment id', Boolean(appointmentId))
  check('new bookings start as pending', booking.data?.appointment?.status === 'pending')
  check(
    'consultation fee is captured at booking time',
    typeof booking.data?.appointment?.consultationFee === 'number',
  )

  // ***** The core requirement: no double booking *****
  const secondPatient = await api('/auth/login', {
    method: 'POST',
    body: { email: 'isha.kapoor@example.com', password: PASSWORD },
  })
  const secondToken = secondPatient.data?.token

  const doubleBooking = await api('/appointments', {
    method: 'POST',
    token: secondToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: bookingDate,
      appointmentTime: freeSlot,
      appointmentType: 'in-clinic',
      reason: 'Attempting to take an already-booked slot',
      patientPhone: '9900000002',
    },
  })
  check(
    'DOUBLE BOOKING is rejected with 409',
    doubleBooking.status === 409,
    `got ${doubleBooking.status}: ${doubleBooking.data?.message}`,
  )

  // The slot must now report as unavailable.
  const afterBooking = await api(`/doctors/${bookingDoctor}/slots?date=${bookingDate}`)
  const bookedSlot = afterBooking.data?.slots?.find((s) => s.time === freeSlot)
  check('the booked slot now reports unavailable', bookedSlot?.available === false)

  // Concurrent race: many simultaneous requests for one free slot.
  let raceSlot = null
  const raceCandidates = await api(`/doctors/${bookingDoctor}/slots?date=${bookingDate}`)
  raceSlot = raceCandidates.data?.slots?.find((s) => s.available)?.time

  if (raceSlot) {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        api('/appointments', {
          method: 'POST',
          token: i % 2 === 0 ? patientToken : secondToken,
          body: {
            doctor: bookingDoctor,
            appointmentDate: bookingDate,
            appointmentTime: raceSlot,
            appointmentType: 'in-clinic',
            reason: `Concurrent race attempt ${i + 1}`,
            patientPhone: '9900000001',
          },
        }),
      ),
    )
    const created = attempts.filter((a) => a.status === 201).length
    check(
      'CONCURRENT race: exactly one booking wins',
      created === 1,
      `${created} of 6 succeeded`,
    )
  } else {
    check('CONCURRENT race: found a slot to contend for', false, 'no free slot remained')
  }

  // Server-side validation of invented times
  const invalidSlot = await api('/appointments', {
    method: 'POST',
    token: patientToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: bookingDate,
      appointmentTime: '03:17', // not on the doctor's slot grid
      reason: 'Attempting a time outside consulting hours',
      patientPhone: '9900000001',
    },
  })
  check(
    'a time outside consulting hours is rejected (400)',
    invalidSlot.status === 400,
    `got ${invalidSlot.status}`,
  )

  const pastBooking = await api('/appointments', {
    method: 'POST',
    token: patientToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: '2020-01-06',
      appointmentTime: '10:00',
      reason: 'Attempting to book in the past',
      patientPhone: '9900000001',
    },
  })
  check('booking in the past is rejected (400)', pastBooking.status === 400)

  const shortReason = await api('/appointments', {
    method: 'POST',
    token: patientToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: bookingDate,
      appointmentTime: freeSlot,
      reason: 'x',
      patientPhone: '9900000001',
    },
  })
  check('too-short reason is rejected (400)', shortReason.status === 400)

  const doctorBooking = await api('/appointments', {
    method: 'POST',
    token: doctorToken,
    body: {
      doctor: bookingDoctor,
      appointmentDate: bookingDate,
      appointmentTime: freeSlot,
      reason: 'A doctor should not be able to book',
      patientPhone: '9900000001',
    },
  })
  check('doctors cannot create bookings (403)', doctorBooking.status === 403)

  // ---------- Privacy ----------
  section('Appointment privacy & status flow')
  const otherPatientRead = await api(`/appointments/${appointmentId}`, { token: secondToken })
  check(
    "a patient cannot read another patient's appointment (403)",
    otherPatientRead.status === 403,
    `got ${otherPatientRead.status}`,
  )

  const ownRead = await api(`/appointments/${appointmentId}`, { token: patientToken })
  check('a patient can read their own appointment', ownRead.status === 200)

  const adminRead = await api(`/appointments/${appointmentId}`, { token: adminToken })
  check('an admin can read any appointment', adminRead.status === 200)

  const list = await api('/appointments', { token: patientToken })
  check('GET /appointments returns the patient list', list.status === 200)
  check(
    'the list only contains this patient’s appointments',
    (list.data?.appointments ?? []).every(
      (a) => a.patient?._id === me.data?.user?._id || a.patient?.email === 'patient@cliniccare.com',
    ),
  )

  const stats = await api('/appointments/stats/summary', { token: patientToken })
  check('GET /appointments/stats/summary returns 200', stats.status === 200)
  check('stats include a total', typeof stats.data?.stats?.total === 'number')

  // Patients may only cancel
  const patientIllegalStatus = await api(`/appointments/${appointmentId}`, {
    method: 'PUT',
    token: patientToken,
    body: { status: 'confirmed' },
  })
  check('a patient cannot confirm their own appointment (403)', patientIllegalStatus.status === 403)

  // ---------- Doctor workflow ----------
  section('Doctor workflow')
  const doctorProfile = await api('/doctors/me/profile', { token: doctorToken })
  check('doctor can read their own profile', doctorProfile.status === 200)

  const doctorStats = await api('/doctors/me/stats', { token: doctorToken })
  check('doctor stats endpoint returns 200', doctorStats.status === 200)

  const doctorAppointments = await api('/appointments?status=pending', { token: doctorToken })
  check('doctor can list their pending appointments', doctorAppointments.status === 200)

  const pendingForDoctor = doctorAppointments.data?.appointments?.[0]
  if (pendingForDoctor) {
    const confirm = await api(`/appointments/${pendingForDoctor._id}`, {
      method: 'PUT',
      token: doctorToken,
      body: { status: 'confirmed' },
    })
    check('doctor can confirm a pending appointment', confirm.status === 200)

    const complete = await api(`/appointments/${pendingForDoctor._id}`, {
      method: 'PUT',
      token: doctorToken,
      body: { status: 'completed' },
    })
    check('doctor can complete a confirmed appointment', complete.status === 200)

    const reComplete = await api(`/appointments/${pendingForDoctor._id}`, {
      method: 'PUT',
      token: doctorToken,
      body: { status: 'cancelled' },
    })
    check('a completed appointment cannot be changed again (400)', reComplete.status === 400)
  } else {
    check('doctor had a pending appointment to act on', false, 'none found')
  }

  const availability = await api('/doctors/me/availability', {
    method: 'PUT',
    token: doctorToken,
    body: { slotDuration: 30, unavailableDates: ['2030-01-01'] },
  })
  check('doctor can update availability', availability.status === 200)

  const badAvailability = await api('/doctors/me/availability', {
    method: 'PUT',
    token: doctorToken,
    body: { unavailableDates: ['not-a-date'] },
  })
  check('invalid unavailable date is rejected (400)', badAvailability.status === 400)

  // ---------- Reviews ----------
  section('Reviews')
  const doctorReviews = await api(`/doctors/${doctorId}/reviews`)
  check('GET /doctors/:id/reviews returns 200', doctorReviews.status === 200)

  const myReviews = await api('/reviews/me', { token: doctorToken })
  check('doctor can list reviews about them', myReviews.status === 200)

  // A review requires a completed appointment belonging to that patient.
  const patientCompleted = await api('/appointments?status=completed', { token: patientToken })
  const reviewable = patientCompleted.data?.appointments?.find((a) => !a.isReviewed)

  if (reviewable) {
    const review = await api(`/doctors/${reviewable.doctor._id}/reviews`, {
      method: 'POST',
      token: patientToken,
      body: { appointment: reviewable._id, rating: 5, comment: 'Automated test review.' },
    })
    check('patient can review a completed appointment', review.status === 201, review.data?.message)

    const duplicateReview = await api(`/doctors/${reviewable.doctor._id}/reviews`, {
      method: 'POST',
      token: patientToken,
      body: { appointment: reviewable._id, rating: 4, comment: 'Second attempt.' },
    })
    check('a second review for the same visit is rejected (409)', duplicateReview.status === 409)
  }

  const pendingList = await api('/appointments?status=pending', { token: patientToken })
  const notCompleted = pendingList.data?.appointments?.[0]
  if (notCompleted) {
    const earlyReview = await api(`/doctors/${notCompleted.doctor._id}/reviews`, {
      method: 'POST',
      token: patientToken,
      body: { appointment: notCompleted._id, rating: 5, comment: 'Too early.' },
    })
    check('cannot review an appointment that is not completed (400)', earlyReview.status === 400)
  }

  const badRating = await api(`/doctors/${doctorId}/reviews`, {
    method: 'POST',
    token: patientToken,
    body: { appointment: appointmentId, rating: 9, comment: 'Out of range.' },
  })
  check('out-of-range rating is rejected (400)', badRating.status === 400)

  // ---------- Admin ----------
  section('Admin endpoints')
  check('admin stats include patient totals', typeof adminStats.data?.stats?.totalPatients === 'number')
  check('admin stats include a monthly trend', Array.isArray(adminStats.data?.stats?.monthly))
  check('admin stats include specialty breakdown', Array.isArray(adminStats.data?.stats?.bySpecialty))

  const adminUsers = await api('/admin/users?role=patient', { token: adminToken })
  check('GET /admin/users returns 200', adminUsers.status === 200)

  const adminDoctors = await api('/admin/doctors', { token: adminToken })
  check('GET /admin/doctors returns 200', adminDoctors.status === 200)

  const adminPatients = await api('/admin/patients', { token: adminToken })
  check('GET /admin/patients returns 200', adminPatients.status === 200)
  check(
    'patients include an appointment count',
    typeof adminPatients.data?.patients?.[0]?.appointmentCount === 'number',
  )

  const adminAppointments = await api('/admin/appointments', { token: adminToken })
  check('GET /admin/appointments returns 200', adminAppointments.status === 200)

  const targetDoctor = adminDoctors.data?.doctors?.[0]
  const unverify = await api(`/admin/doctors/${targetDoctor._id}/verify`, {
    method: 'PUT',
    token: adminToken,
    body: { isVerified: false },
  })
  check('admin can remove verification', unverify.status === 200)

  const afterUnverify = await api('/doctors?limit=50')
  check(
    'an unverified doctor disappears from the public directory',
    afterUnverify.data?.total === 14,
    `got ${afterUnverify.data?.total}`,
  )

  const reverify = await api(`/admin/doctors/${targetDoctor._id}/verify`, {
    method: 'PUT',
    token: adminToken,
    body: { isVerified: true },
  })
  check('admin can restore verification', reverify.status === 200)

  const selfDisable = await api(`/admin/users/${adminLogin.data.user._id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: { isActive: false },
  })
  check('admin cannot disable their own account (400)', selfDisable.status === 400)

  // Disabling an account must block sign-in.
  const victim = registered.data?.user
  const disable = await api(`/admin/users/${victim._id}/status`, {
    method: 'PUT',
    token: adminToken,
    body: { isActive: false },
  })
  check('admin can disable a user account', disable.status === 200)

  const disabledLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: uniqueEmail, password: PASSWORD },
  })
  check('a disabled account cannot sign in (403)', disabledLogin.status === 403)

  await api(`/admin/users/${victim._id}`, { method: 'DELETE', token: adminToken })

  // ---------- Specialty management ----------
  section('Specialty management')
  const created = await api('/specialties', {
    method: 'POST',
    token: adminToken,
    body: {
      name: `Test Specialty ${Date.now()}`,
      description: 'A specialty created by the automated API test suite.',
      conditions: ['Test condition'],
    },
  })
  check('admin can create a specialty', created.status === 201)
  check('slug is generated automatically', Boolean(created.data?.specialty?.slug))

  const patientCreate = await api('/specialties', {
    method: 'POST',
    token: patientToken,
    body: { name: 'Illegal', description: 'A patient should not be able to create this.' },
  })
  check('a patient cannot create a specialty (403)', patientCreate.status === 403)

  const deleted = await api(`/specialties/${created.data?.specialty?._id}`, {
    method: 'DELETE',
    token: adminToken,
  })
  check('admin can delete an unused specialty', deleted.status === 200)

  const inUse = specialties.data?.specialties?.find((s) => s.doctorCount > 0)
  if (inUse) {
    const blocked = await api(`/specialties/${inUse._id}`, { method: 'DELETE', token: adminToken })
    check(
      'a specialty still in use cannot be deleted (409)',
      blocked.status === 409,
      `got ${blocked.status}`,
    )
  }

  // ---------- Not found ----------
  section('Error handling')
  const missing = await api('/doctors/000000000000000000000000')
  check('unknown doctor id returns 404', missing.status === 404)

  const malformed = await api('/doctors/not-an-object-id')
  check('malformed id returns 400', malformed.status === 400)

  const noRoute = await api('/this-route-does-not-exist')
  check('unknown route returns 404', noRoute.status === 404)

  // ---------- Cleanup ----------
  if (appointmentId) {
    await api(`/appointments/${appointmentId}`, { method: 'DELETE', token: adminToken })
  }

  // ---------- Summary ----------
  console.log('\n══════════════════════════════════════════')
  console.log(`  Passed: \x1b[32m${passed}\x1b[0m    Failed: ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : '0'}`)
  console.log('══════════════════════════════════════════')
  if (failures.length > 0) {
    console.log('\nFailures:')
    failures.forEach((f) => console.log(`  • ${f}`))
  }
  console.log()

  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('\nTest suite crashed:', err)
  process.exit(1)
})
