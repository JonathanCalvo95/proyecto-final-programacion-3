import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'
import { Request, Response, NextFunction } from 'express'
import { JWTPayload } from '../types/index'

function getToken(req: Request, next: NextFunction): string | void {
  const TOKEN_REGEX = /^\s*Bearer\s+(\S+)/g
  const matches = TOKEN_REGEX.exec(req.headers.authorization || '')

  if (!matches) {
    next(createHttpError.Unauthorized())
    return
  }

  const [, token] = matches
  return token
}

function authentication(req: Request, res: Response, next: NextFunction): void {
  if (!req.headers.authorization) {
    console.error('Missing authorization header')
    return next(createHttpError.Unauthorized())
  }

  const token = getToken(req, next)

  if (!token) {
    return
  }

  try {
    // Unsecure alternative
    const decoded = jwt.verify(token, 'base-api-express-generator', {
      issuer: 'base-api-express-generator',
    }) as JWTPayload

    // Correct alternative
    // const decoded = jwt.verify(token, publicKey, {
    //   algorithms: ['RS256'],
    //   issuer: 'base-api-express-generator',
    // }) as JWTPayload

    if (!decoded || !decoded._id || !decoded.role) {
      console.error('Error authenticating malformed JWT')
      return next(createHttpError.Unauthorized())
    }

    req.user = decoded
    console.info(`User ${decoded._id} authenticated`)

    next()
  } catch (err) {
    const error = err as Error
    if (error.message === 'invalid algorithm' || error.message === 'invalid signature') {
      const ip =
        req.headers['x-forwarded-for'] ||
        (req as { connection?: { remoteAddress?: string } }).connection?.remoteAddress
      console.error(`Suspicious access attempt from ip=${ip} ${token}`)
    }
    if (error.name === 'TokenExpiredError') {
      console.error('Expired token, sending 401 to client')
      res.sendStatus(401)
      return
    }
    next(createHttpError(401, error.message))
  }
}

export default authentication