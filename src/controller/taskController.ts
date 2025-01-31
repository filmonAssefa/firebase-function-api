import { Request, Response } from 'express'
import {
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  query,
  where,
  limit,
  orderBy,
  startAfter,
} from 'firebase/firestore'
import { db } from '../config/firebase'
import logger from '../config/logger'
import { Task } from '../models/taskModle'

/*

          C R E A T E -  T A S K

*/
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status }: Task = req.body

    // Add task document to Firestore
    const docRef = await addDoc(collection(db, 'tasks'), {
      title,
      description,
      status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Fetch the newly created document
    const taskDoc = await getDoc(doc(db, 'tasks', docRef.id))

    if (!taskDoc.exists()) {
      throw new Error('Failed to retrieve the newly created task')
    }

    // Convert timestamps to ISO string
    const taskData = taskDoc.data()
    res.status(201).json({
      id: taskDoc.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      createdAt: taskData.createdAt.toDate().toISOString(),
      updatedAt: taskData.updatedAt.toDate().toISOString(),
    })

    logger.info(`Task created: ${docRef.id}`)
  } catch (error) {
    logger.error(`Error creating task: ${error}`)
    res.status(500).json({ error: 'Failed to create task' })
  }
}

/*

          G E T - A L L - T A S K

*/

export const getTasks = async (req: Request, res: Response) => {
  try {
    const {
      search,
      status,
      limit: limitParam,
      page: pageParam,
      lastDocId,
    } = req.query

    const page = Number(pageParam) > 0 ? Number(pageParam) : 1
    const limitValue = Number(limitParam) > 0 ? Number(limitParam) : 5

    let tasksQuery = query(
      collection(db, 'tasks'),
      orderBy('createdAt', 'desc'),
    )

    // Apply search filter (case-insensitive)
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase()
      tasksQuery = query(
        tasksQuery,
        where('searchKeywords', 'array-contains', searchLower), // Using an indexed field
      )
    }

    // Apply status filter
    if (status && typeof status === 'string') {
      tasksQuery = query(tasksQuery, where('status', '==', status))
    }

    // Handle pagination using lastDocId
    if (lastDocId && typeof lastDocId === 'string') {
      const lastDocSnapshot = await getDoc(doc(db, 'tasks', lastDocId))
      if (lastDocSnapshot.exists()) {
        tasksQuery = query(
          tasksQuery,
          startAfter(lastDocSnapshot),
          limit(limitValue),
        )
      }
    } else {
      tasksQuery = query(tasksQuery, limit(limitValue))
    }

    // Fetch tasks from Firestore
    const querySnapshot = await getDocs(tasksQuery)
    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString() || null,
    }))

    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1]

    res.status(200).json({
      tasks,
      currentPage: page,
      limit: limitValue,
      lastDocId: lastVisibleDoc ? lastVisibleDoc.id : null,
    })
  } catch (error: unknown) {
    console.error(`Error fetching tasks: ${error}`)
    res.status(500).json({
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/*

          G E T - T A S K - B Y - I D

*/
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const taskDoc = await getDoc(doc(db, 'tasks', id))

    if (!taskDoc.exists()) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const taskData = taskDoc.data()
    res.status(200).json({
      id: taskDoc.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      createdAt: taskData.createdAt.toDate().toISOString(),
      updatedAt: taskData.updatedAt.toDate().toISOString(),
    })
  } catch (error) {
    logger.error(`Error fetching task: ${error}`)
    res.status(500).json({ error: 'Failed to fetch task' })
  }
}

/*

          U P D A T E - T A S K

*/

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { title, description, status }: Task = req.body

    // Update the task
    await updateDoc(doc(db, 'tasks', id), {
      title,
      description,
      status,
      updatedAt: serverTimestamp(),
    })

    // Fetch the updated document
    const updatedTaskDoc = await getDoc(doc(db, 'tasks', id))
    if (!updatedTaskDoc.exists()) {
      throw new Error('Failed to retrieve the updated task')
    }

    const updatedTask = updatedTaskDoc.data()
    res.status(200).json({
      id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status,
      createdAt: updatedTask.createdAt.toDate().toISOString(),
      updatedAt: updatedTask.updatedAt.toDate().toISOString(),
    })

    logger.info(`Task updated: ${id}`)
  } catch (error) {
    logger.error(`Error updating task: ${error}`)
    res.status(500).json({ error: 'Failed to update task' })
  }
}

/*

         D E L E T E  - T A S K

*/
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await deleteDoc(doc(db, 'tasks', id))
    logger.info(`Task deleted: ${id}`)
    res.status(20).json({ message: 'Task deleted successfully' })
  } catch (error) {
    logger.error(`Error deleting task: ${error}`)
    res.status(500).json({ error: 'Failed to delete task' })
  }
}
