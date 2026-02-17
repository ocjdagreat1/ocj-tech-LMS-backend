import express from 'express'
import {
  addCourse,
  educatorDashboardData,
  getEducatorCourses,
  getEnrolledStudentsData,
  updateRoleToEducator
} from '../controllers/educatorController.js'

import { requireAuth } from '@clerk/express'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleware.js'

const educatorRouter = express.Router()

// Become educator (WRITE → POST)
educatorRouter.post('/update-role', requireAuth(), updateRoleToEducator)

// Add course
educatorRouter.post(
  '/add-course',
  requireAuth(),
  protectEducator,
  upload.single('image'),
  addCourse
)

// Educator routes
educatorRouter.get('/courses', requireAuth(), protectEducator, getEducatorCourses)
educatorRouter.get('/dashboard', requireAuth(), protectEducator, educatorDashboardData)
educatorRouter.get('/enrolled-students', requireAuth(), protectEducator, getEnrolledStudentsData)

export default educatorRouter;
