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


// initialise express
const app = express();


// ---------------- DATABASE CONNECTIONS ----------------
await connectDB();
await connectCloudinary();


// ---------------- WEBHOOKS ----------------
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


// ---------------- MIDDLEWARES ----------------

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://ocj-tech-lms-frontend-okxd.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {

    // allow requests with no origin (mobile apps, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS not allowed"), false);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Clerk auth middleware
app.use(clerkMiddleware());

// ROUTES 

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.use("/api/educator",express.json(), educatorRouter);
app.use("/api/course",express.json(), courseRouter);
app.use("/api/user", express.json(),userRouter);
app.use("/api/newsletter", express.json(), newsletterRouter);


//  SERVER 
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
