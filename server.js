import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'

//initialise
const app = express()

//connect to Database
await connectDB()

//Middlewares
app.use(cors())

//routes
app.get('/',(req,res)=> res.send("Api is working fine"))
app.post('/clerk',express.json(),clerkWebhooks)

//Port
const PORT = process.env.PORT|| 5000

app.listen(PORT, ()=>{
  console.log(`sever is running on port ${PORT}`)
})