import jwt from 'jsonwebtoken'

/** Sign a JWT for a user id. The secret must be supplied by the environment. */
export default function generateToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Refusing to sign tokens with a missing secret.')
  }

  return jwt.sign({ id: String(userId) }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}
