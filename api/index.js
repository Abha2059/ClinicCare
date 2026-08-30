/**
 * Vercel serverless entry.
 *
 * Wraps the Express app: on Vercel nothing calls app.listen(), so this
 * handler receives every /api request. The database connection is opened on
 * first use and cached across warm invocations — reconnecting per request
 * would exhaust Atlas connection limits under any real traffic.
 */
import app from '../server/server.js'
import connectDB from '../server/config/db.js'

let ready = null

export default async function handler(req, res) {
  if (!ready) ready = connectDB()
  try {
    await ready
  } catch (error) {
    // A failed attempt must not poison every later request.
    ready = null
    console.error('[db] Connection failed:', error.message)
    res.statusCode = 503
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ success: false, message: 'Database unavailable, try again shortly' }))
    return
  }
  return app(req, res)
}
