import express, { Request, Response, NextFunction } from 'express'
import morgan from 'morgan'
import taskRoutes from './routes/router'
import cors from 'cors'
import AppError from './utils/appError'
import { errorHandler } from './utils/errorHandler'

const app = express()
app.use(express.json())

// middleware
app.use(morgan('dev'))
app.use(cors())

const corsOptions = {
  origin: process.env.ORIGIN, // Allow requests from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // HTTP methods should be strings
}

app.use(cors(corsOptions))
// routes
app.use('/api/tasks', taskRoutes)

// Error handling middleware
app.use(errorHandler)

// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

export default app
