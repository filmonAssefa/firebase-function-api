import { FirebaseError } from 'firebase/app'
import { Request, Response, NextFunction } from 'express'
import logger from '../config/logger'
import AppError from './appError'

interface CustomError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
  code?: string
}

const handleFirebaseError = (error: FirebaseError) => {
  switch (error.code) {
    case 'permission-denied':
      return new AppError(
        'You do not have permission to perform this action',
        403,
      )
    case 'not-found':
      return new AppError('Requested resource not found', 404)
    case 'already-exists':
      return new AppError('Resource already exists', 409)
    case 'failed-precondition':
      return new AppError('Request failed precondition check', 412)
    case 'resource-exhausted':
      return new AppError('Quota exceeded or rate limit reached', 429)
    default:
      return new AppError('Internal Server Error', 500)
  }
}

const sendErrorDev = (err: CustomError, res: Response) => {
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const sendErrorProd = (err: CustomError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      message: err.message,
    })
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err)
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    logger.error({
      message: err.message,
      error: err,
      stack: err.stack,
    })
    sendErrorDev(err, res)
  } else {
    let error = { ...err }
    error.message = err.message

    if (err instanceof FirebaseError) {
      error = handleFirebaseError(err)
    }

    logger.error({
      message: error.message,
      error: error,
      stack: error.stack,
    })
    sendErrorProd(error, res)
  }
}
