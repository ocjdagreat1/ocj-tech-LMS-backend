import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

// initialise
const app = express()

// connect DB
await connectDB()

// middlewares
app.use(cors())

// clerk route
app.post(
  '/clerk',
  express.raw({ type: 'application/json' }),
  clerkWebhooks
)

// normal routes can still use json
app.use(express.json())

app.get('/', (req, res) => res.send("API is working fine"))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`)
})
