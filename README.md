# ClinicCare

**Better Care. Better Health.**

🌐 **Live demo:** [clinic-care-six.vercel.app](https://clinic-care-six.vercel.app)

A complete full-stack healthcare appointment platform. Patients discover doctors and book
appointments, doctors manage their availability and consultations, and administrators oversee
the whole service.

> **Demonstration project.** Every doctor profile, review and appointment in this application is
> fictional. ClinicCare provides appointment scheduling only — it is not medical advice, and it is
> not affiliated with any real healthcare provider.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available commands](#available-commands)
- [Demo accounts](#demo-accounts)
- [API reference](#api-reference)
- [How double booking is prevented](#how-double-booking-is-prevented)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Overview

ClinicCare is a role-based appointment system built around three users:

| Role        | Can do                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| **Patient** | Search doctors, browse specialties, book/cancel appointments, manage profile, leave reviews  |
| **Doctor**  | Manage profile and consulting hours, accept/reject/complete appointments, read reviews       |
| **Admin**   | Verify doctors, manage specialties, disable accounts, view platform-wide statistics          |

---

## Features

### Patients
- Doctor directory with search, and filters for specialty, experience, consultation fee and rating
- Sorting by rating, experience or fee, with pagination
- Full doctor profiles: qualifications, experience, languages, expertise, fees, reviews, consulting hours
- Seven-step booking flow with live slot availability
- Dashboard with appointment statistics and history
- Cancel upcoming appointments; review completed ones
- Profile management and password changes

### Doctors
- Dashboard covering today's schedule, pending requests and completed consultations
- Accept, reject or complete appointment requests
- Weekly consulting hours, configurable slot length, and blocked dates
- Editable public profile (specialty, qualifications, languages, expertise, fee)
- Patient reviews with a rating breakdown

### Administrators
- Platform statistics, six-month appointment trend and specialty breakdown
- Verify or unverify doctors (unverified doctors are hidden from the public directory)
- Enable or disable any account
- Full CRUD for specialties
- Searchable views of every doctor, patient and appointment

### Throughout
- Loading, empty and error states on every data-driven page
- Responsive from 320px upward with no horizontal overflow
- Accessible: semantic HTML, labelled controls, keyboard navigation, visible focus, ARIA where needed
- Toast notifications, modals with focus trapping, skeleton loaders

---

## Tech stack

**Frontend** — React 19, Vite, JavaScript, React Router, Tailwind CSS, Axios, React Hook Form,
Lucide React, Context API

**Backend** — Node.js, Express 5, REST API

**Database** — MongoDB with Mongoose (local instance or MongoDB Atlas)

**Auth** — JWT, bcrypt password hashing, protected routes, role-based authorisation

**Security** — Helmet, CORS allow-list, rate limiting, express-validator, centralised error handling

---

## Architecture

```
Browser ──▶ React SPA (Vite)
               │  axios instance, JWT attached per request
               ▼
           Express REST API
               │  protect → authorize(role) → validate → controller
               ▼
           MongoDB (Mongoose models)
```

- **State** — `AuthContext` owns the session; `AppContext` owns toasts and shared specialties.
- **Data access** — every call goes through `src/services/*`, never straight from a component.
- **Authorisation** — enforced server-side on every route; the UI mirrors it for usability only.

---

## Folder structure

```
ClinicCare/
├── client/                     # React + Vite frontend
│   ├── public/logo.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Button, Modal, Toast, Pagination, Rating, States…
│   │   │   ├── layout/         # Header, Footer, DashboardLayout, ErrorBoundary
│   │   │   ├── doctors/        # DoctorCard, DoctorFilters
│   │   │   ├── specialties/    # SpecialtyCard, icon mapping
│   │   │   ├── appointments/   # SlotPicker, Stepper, AppointmentCard
│   │   │   ├── dashboard/      # StatCard, PageHeader, MiniBarChart
│   │   │   └── forms/          # FormField, PasswordInput
│   │   ├── pages/              # One folder per route group
│   │   ├── context/            # AuthContext, AppContext
│   │   ├── hooks/              # useFetch, useDebounce, useDocumentTitle, useMediaQuery
│   │   ├── services/           # api.js + one service per resource
│   │   ├── routes/             # ProtectedRoute, PublicOnlyRoute
│   │   ├── utils/              # constants, helpers, validators
│   │   ├── data/               # Static FAQ content
│   │   ├── App.jsx             # Route table
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── vercel.json
│
├── server/                     # Express REST API
│   ├── config/db.js
│   ├── controllers/            # auth, doctor, patient, appointment, specialty, review, admin
│   ├── middleware/             # auth, role, validation, error
│   ├── models/                 # User, Doctor, Specialty, Appointment, Review
│   ├── routes/                 # One router per resource
│   ├── seed/
│   │   ├── seedData.js         # npm run seed
│   │   ├── apiTest.mjs         # npm test
│   │   ├── specialties.js
│   │   └── doctors.js
│   ├── utils/                  # ApiError, asyncHandler, generateToken, dateUtils
│   ├── server.js
│   └── vercel.json
│
├── .gitignore
├── .env.example
├── package.json                # Root scripts (run both apps together)
└── README.md
```

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB — a local install, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Install dependencies

```bash
git clone <your-repository-url>
cd ClinicCare
npm run install:all      # installs root, client and server dependencies
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Generate a strong JWT secret and paste it into `server/.env`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start MongoDB

**Local:**
```bash
mongod --dbpath ./.mongo-data
```

**MongoDB Atlas:** create a free cluster, add a database user, allow your IP under Network Access,
then copy the SRV connection string into `MONGODB_URI` in `server/.env`:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/cliniccare?retryWrites=true&w=majority
```

### 4. Seed demonstration data

```bash
npm run seed
```

Creates 17 specialties, 15 verified doctors, 6 patients, 1 admin, 20 appointments and 9 reviews.

### 5. Run the app

```bash
npm run dev        # starts the API and the frontend together
```

- Frontend → http://localhost:5173
- API → http://localhost:5001/api
- Health check → http://localhost:5001/api/health

> **Note on ports:** the API uses **5001** because macOS AirPlay Receiver occupies port 5000.
> Change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env` together if you prefer another.

---

## Environment variables

### `server/.env`

| Variable         | Required | Description                                              |
| ---------------- | -------- | -------------------------------------------------------- |
| `PORT`           | no       | API port (default `5001`)                                |
| `NODE_ENV`       | no       | `development` or `production`                            |
| `MONGODB_URI`    | **yes**  | MongoDB connection string (local or Atlas)               |
| `JWT_SECRET`     | **yes**  | Long random string used to sign tokens                   |
| `JWT_EXPIRES_IN` | no       | Token lifetime (default `7d`)                            |
| `CLIENT_URL`     | no       | Allowed CORS origin(s), comma-separated                  |

### `client/.env`

| Variable       | Required | Description                                     |
| -------------- | -------- | ----------------------------------------------- |
| `VITE_API_URL` | **yes**  | Base API URL, e.g. `http://localhost:5001/api`  |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing. Real secrets live only in
`.env`, which is gitignored — `.env.example` is the committed template.

---

## Available commands

Run from the project root:

| Command               | Description                                  |
| --------------------- | -------------------------------------------- |
| `npm run install:all` | Install all dependencies                     |
| `npm run dev`         | Run API and frontend together                |
| `npm run dev:client`  | Frontend only                                |
| `npm run dev:server`  | API only                                     |
| `npm run build`       | Production build of the frontend             |
| `npm run seed`        | Reset and repopulate the database            |
| `npm start`           | Start the API in production mode             |
| `npm test`            | Run the API test suite (API must be running) |

---

## Demo accounts

All demo accounts .

| Role    | Email                     |
| ------- | ------------------------- |
| Patient | `patient@cliniccare.com`  |
| Doctor  | `doctor@cliniccare.com`   |
| Admin   | `cliniccare26@gmail.com`    |

New sign-ups are always created as patients — roles cannot be self-assigned.

---

## API reference

Base URL: `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint                       | Access        |
| ------ | ------------------------------ | ------------- |
| POST   | `/auth/register`               | Public        |
| POST   | `/auth/login`                  | Public        |
| POST   | `/auth/logout`                 | Public        |
| GET    | `/auth/me`                     | Authenticated |
| PUT    | `/auth/profile`                | Authenticated |
| PUT    | `/auth/password`               | Authenticated |
| POST   | `/auth/forgot-password`        | Public        |
| POST   | `/auth/reset-password/:token`  | Public        |

### Doctors
| Method | Endpoint                    | Access  |
| ------ | --------------------------- | ------- |
| GET    | `/doctors`                  | Public  |
| GET    | `/doctors/:id`              | Public  |
| GET    | `/doctors/:id/slots?date=`  | Public  |
| GET    | `/doctors/me/profile`       | Doctor  |
| PUT    | `/doctors/me/profile`       | Doctor  |
| PUT    | `/doctors/me/availability`  | Doctor  |
| GET    | `/doctors/me/stats`         | Doctor  |
| POST   | `/doctors`                  | Admin   |
| PUT    | `/doctors/:id`              | Admin   |
| DELETE | `/doctors/:id`              | Admin   |

`GET /doctors` accepts `search`, `specialty`, `minExperience`, `minRating`, `maxFee`, `sort`, `page`, `limit`.

### Specialties
| Method | Endpoint               | Access |
| ------ | ---------------------- | ------ |
| GET    | `/specialties`         | Public |
| GET    | `/specialties/:idOrSlug` | Public |
| POST   | `/specialties`         | Admin  |
| PUT    | `/specialties/:id`     | Admin  |
| DELETE | `/specialties/:id`     | Admin  |

### Appointments
| Method | Endpoint                      | Access                       |
| ------ | ----------------------------- | ---------------------------- |
| POST   | `/appointments`               | Patient                      |
| GET    | `/appointments`               | Authenticated (role-scoped)  |
| GET    | `/appointments/:id`           | Owner, treating doctor, admin |
| PUT    | `/appointments/:id`           | Owner, treating doctor, admin |
| DELETE | `/appointments/:id`           | Admin                        |
| GET    | `/appointments/stats/summary` | Authenticated                |

### Reviews
| Method | Endpoint                 | Access        |
| ------ | ------------------------ | ------------- |
| GET    | `/doctors/:id/reviews`   | Public        |
| POST   | `/doctors/:id/reviews`   | Patient       |
| GET    | `/reviews/me`            | Doctor        |
| DELETE | `/reviews/:id`           | Author, admin |

### Admin
| Method | Endpoint                        | Access |
| ------ | ------------------------------- | ------ |
| GET    | `/admin/stats`                  | Admin  |
| GET    | `/admin/users`                  | Admin  |
| GET    | `/admin/doctors`                | Admin  |
| GET    | `/admin/patients`               | Admin  |
| GET    | `/admin/appointments`           | Admin  |
| PUT    | `/admin/doctors/:id/verify`     | Admin  |
| PUT    | `/admin/users/:id/status`       | Admin  |
| DELETE | `/admin/users/:id`              | Admin  |

---

## How double booking is prevented

Two patients must never hold the same doctor, date and time. ClinicCare enforces this in three
layers, so the guarantee survives even a simultaneous race:

1. **The UI only offers free slots.** `GET /doctors/:id/slots` returns each slot with an
   `available` flag; booked and already-passed times are disabled.

2. **The server re-validates every booking.** The client is never trusted. On `POST /appointments`
   the API confirms the doctor is verified and active, the date is not blocked, the time is a real
   slot inside the doctor's consulting hours, the slot has not passed, and no active appointment
   already holds it.

3. **The database has the final say.** A partial unique index guarantees it at the storage layer:

   ```js
   appointmentSchema.index(
     { doctor: 1, appointmentDate: 1, appointmentTime: 1 },
     { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'completed'] } } },
   )
   ```

   If two requests pass the read check at the same instant, MongoDB rejects the second write with a
   duplicate-key error, which the error middleware turns into a clear `409`. Cancelled and rejected
   appointments are excluded from the index, so calling off a visit frees the slot again.

The test suite verifies this by firing six concurrent requests at a single free slot and asserting
that **exactly one** succeeds.

---

## Testing

With the API running:

```bash
npm test
```

The suite covers 92 assertions across health checks, the public directory, filtering and sorting,
authentication, role authorisation, slot availability, the booking flow, double booking (including
the concurrent race), appointment privacy, status transitions, reviews, admin endpoints, specialty
management and error handling.

The frontend was additionally verified in a real browser: every route renders with no console
errors, the complete booking flow succeeds end to end, all three dashboards load live data, and no
page overflows horizontally at 320, 375, 425, 768, 1024 or 1440px.

---

## Deployment

### Frontend → Vercel

1. Push the repository to GitHub.
2. In Vercel, **New Project** → import the repository.
3. Set **Root Directory** to `client`. The framework preset (Vite), build command and output
   directory are picked up from `client/vercel.json`.
4. Add the environment variable:
   ```
   VITE_API_URL = https://your-api-domain.com/api
   ```
5. Deploy. `client/vercel.json` rewrites all paths to `index.html`, so React Router routes work
   after a refresh.

### Backend

The API is a standard Express app and runs anywhere Node does (Render, Railway, Fly.io, a VPS).
`server/vercel.json` is included for Vercel's Node runtime — note that serverless platforms suit
this API but keep MongoDB connection pooling in mind under load.

Set these environment variables on the host:

```
MONGODB_URI = <your MongoDB Atlas connection string>
JWT_SECRET  = <a long random string>
CLIENT_URL  = https://your-frontend-domain.vercel.app
NODE_ENV    = production
```

`CLIENT_URL` must match the deployed frontend origin exactly, or CORS will block the browser.

### Database → MongoDB Atlas

1. Create a free cluster.
2. Add a database user under **Database Access**.
3. Under **Network Access**, allow your deployment platform's IPs (or `0.0.0.0/0` for testing).
4. Copy the SRV connection string into `MONGODB_URI`.
5. Seed the production database once:
   ```bash
   MONGODB_URI="<atlas-uri>" npm run seed
   ```

---

## Licence

MIT — provided as a demonstration project.
