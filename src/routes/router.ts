import express from 'express'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controller/taskController'

const router = express.Router()

router.post('/', createTask)
router.get('/', getTasks)
router.get('/:id', getTaskById as express.RequestHandler)
router.patch('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
