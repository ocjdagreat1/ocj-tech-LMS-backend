import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhooks, stripeWebhooks } from "./controllers/webhooks.js";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoute.js";
import newsletterRouter from "./routes/newsletterRoute.js"
import contactRouter from "./routes/contactRoutes.js";


// initialise express
const app = express();


//  DATABASE CONNECTIONS 
await connectDB();
await connectCloudinary();


// WEBHOOKS 
// IMPORTANT: webhooks MUST come BEFORE express.json()

// Clerk webhook
app.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhooks
);

// Stripe webhook
app.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhooks
);


// MIDDLEWARES 

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://ocjtechglobal.store",
  "https://www.ocjtechglobal.store"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));


// Clerk auth middleware
app.use(clerkMiddleware());

// ROUTES 

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use(express.json());
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/contact", contactRouter);



//  SERVER 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
