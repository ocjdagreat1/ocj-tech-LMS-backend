import express from 'express'
import { addCourse, educatorDashboardData, getEducatorCourses, getEnrolledStudentsData, updateRoleToEducator } from '../controllers/educatorController.js'
import { requireAuth } from '@clerk/express'
import upload from '../configs/multer.js'
import { protectEducator } from '../middlewares/authMiddleware.js'

const educatorRouter = express.Router()

// Become educator (only login required)
educatorRouter.post('/update-role', requireAuth(),updateRoleToEducator)

// Real educator actions (login + role required)
educatorRouter.post('/add-course',requireAuth(),protectEducator,upload.single('image'),
addCourse
)

educatorRouter.get('/courses',requireAuth(),protectEducator, getEducatorCourses)

educatorRouter.get('/dashboard', requireAuth(),protectEducator,educatorDashboardData)
educatorRouter.get('/enrolled-students',requireAuth(),protectEducator,getEnrolledStudentsData
)
