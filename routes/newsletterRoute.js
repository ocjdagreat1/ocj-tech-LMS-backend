import express from "express";
import { subscribeNewsletter, getSubscribers } from "../controllers/newsletterController.js";

const router = express.Router();

// Public subscription route
router.post("/subscribe", subscribeNewsletter);

// Optional admin route
router.get("/subscribers", getSubscribers);

export default router;
