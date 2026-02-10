import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoute.js';


//initialise Express
const app = express();

// Connect to MongoDB
await connectDB();
await connectCloudinary()


//Clerk webhook route (needs raw body)
app.post('/clerk',express.raw({ type: 'application/json' }),clerkWebhooks);


// Middlewares
app.use(cors({
  origin: "http://localhost:5173", 

  credentials: true,
}));
app.use(clerkMiddleware());

//  JSON parsing for normal routes
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send("API is running!"));
app.use('/api/educator',express.json(),educatorRouter);
app.use('/api/course',courseRouter);
app.use('/api/user',userRouter);
app.post('/stripe',express.raw({type:'application/json'}),stripeWebhooks)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
