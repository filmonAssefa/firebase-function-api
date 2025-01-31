import http from 'http'
import logger from './src/config/logger'
import app from './src/app'
import dotenv from 'dotenv'

dotenv.config()

const port = process.env.PORT

const server = http.createServer(app)

server.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
