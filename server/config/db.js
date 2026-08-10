import mongoose from 'mongoose'

/**
 * Connect to MongoDB. The URI always comes from the environment so the same
 * code runs against a local instance or MongoDB Atlas without edits.
 */
export default async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Copy server/.env.example to server/.env and provide a connection string.',
    )
  }

  mongoose.set('strictQuery', true)

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  })

  console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  return conn
}
