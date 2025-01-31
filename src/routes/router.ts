import express from 'express'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../controller/taskController'

const router = express.Router()

// router.post('/', createTask)
// router.get('/', getTasks)
// router.delete('/:id', deleteTask)
// router.get('/:id', getTaskById as express.RequestHandler)

router.route('/').post(createTask).get(getTasks)
router
  .route('/:id')
  .patch(updateTask)
  .delete(deleteTask)
  .get(getTaskById as express.RequestHandler)

export default router
