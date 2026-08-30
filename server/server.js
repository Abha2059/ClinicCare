import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import mongoose from 'mongoose'

import connectDB from './config/db.js'
import { errorHandler, notFound } from './middleware/errorMiddleware.js'

import authRoutes from './routes/authRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import patientRoutes from './routes/patientRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import specialtyRoutes from './routes/specialtyRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// Behind a proxy (Vercel, Render), trust the forwarded IP so rate limiting
// keys on the real client rather than the proxy.
app.set('trust proxy', 1)

// ---------- Security & parsing ----------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // The client's index.html carries a small inline script that applies the
    // saved theme before first paint; the default CSP would block it.
    contentSecurityPolicy: false,
  }),
)

/**
 * CORS. In development any localhost origin is allowed so the Vite dev server
 * works on whichever port it lands on; in production only CLIENT_URL is.
 */
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests and curl/server-to-server calls have no origin.
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true)
      }
      return callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// A broad ceiling on API traffic; credential routes add their own tighter limit.
// Development is given plenty of headroom so local testing is never throttled.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 600 : 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please slow down and try again.' },
  }),
)

// ---------- Health ----------
app.get('/api/health', (_req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting']
  res.json({
    success: true,
    service: 'ClinicCare API',
    status: 'ok',
    database: states[mongoose.connection.readyState] ?? 'unknown',
    timestamp: new Date().toISOString(),
  })
})

// ---------- Routes ----------
app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/specialties', specialtyRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/admin', adminRoutes)

// ---------- Client (production) ----------
// In production the built React app is served by this same process, so the
// whole platform lives at one URL. API routes above always win; any other
// GET falls through to the SPA, which handles routing client-side.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../client/dist')
  app.use(express.static(clientDist))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'ClinicCare API — Better Care. Better Health.',
      docs: '/api/health',
    })
  })
}

// ---------- Errors ----------
app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

/**
 * Fail fast on missing configuration rather than starting a server that
 * cannot authenticate anyone.
 */
function assertConfig() {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(
      `[config] Missing required environment variable(s): ${missing.join(', ')}\n` +
        '        Copy server/.env.example to server/.env and fill them in.',
    )
    process.exit(1)
  }
}

async function start() {
  assertConfig()
  try {
    await connectDB()
  } catch (error) {
    console.error('[db] Could not connect to MongoDB:', error.message)
    process.exit(1)
  }

  const server = app.listen(PORT, () => {
    console.log(`[api] ClinicCare API listening on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`)
  })

  // Don't leave the process running in an undefined state after a crash.
  process.on('unhandledRejection', (reason) => {
    console.error('[fatal] Unhandled rejection:', reason)
    server.close(() => process.exit(1))
  })

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down…`)
    server.close(async () => {
      await mongoose.connection.close()
      process.exit(0)
    })
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

// Vercel imports the app rather than listening on a port.
if (process.env.VERCEL !== '1') {
  start()
}

export default app
