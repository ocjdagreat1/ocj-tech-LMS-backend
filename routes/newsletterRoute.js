import express from "express";
import {
  subscribeNewsletter,
  unsubscribeNewsletter,
  checkSubscription,
} from "../controllers/newsletterController.js";

const router = express.Router();

router.post("/subscribe", subscribeNewsletter);
router.delete("/unsubscribe", unsubscribeNewsletter); // email sent in body
router.get("/check/:email", checkSubscription); // optional for frontend toggle

export default router;
