import Newsletter from "../models/Newsletter.js";
import resend from "../configs/resend.js";
import crypto from "crypto";

// Subscribe to newsletter
export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const existing = await Newsletter.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: "Email already subscribed" });

    // Generate a unique unsubscribe token
    const unsubscribeToken = crypto.randomBytes(20).toString("hex");

    const newSubscriber = new Newsletter({ email, unsubscribeToken });
    await newSubscriber.save();

    // Send confirmation email
    const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${unsubscribeToken}`;
    await resend.emails.send({
  from: `OCJ TECH <${process.env.EMAIL_FROM}>`, // ✅ use verified domain
  to: email,
  subject: "Welcome to OCJ TECH GLOBAL Newsletter",
  html: `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to OCJ TECH!</h2>
      <p>Thank you for subscribing to our newsletter. You'll now receive weekly updates and resources.</p>
      <p>If you wish to unsubscribe at any time, click <a href="${unsubscribeUrl}">here</a>.</p>
      <br/>
      <p><strong>— The OCJ TECH Team</strong></p>
    </div>
  `,
});
    return res.json({
      success: true,
      message: "Subscribed successfully. Confirmation email sent!",
    });
  } catch (error) {
    console.error("Subscribe Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Unsubscribe using email (for toggle button)
export const unsubscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email is required" });

    const subscriber = await Newsletter.findOneAndDelete({ email });

    if (!subscriber)
      return res.status(400).json({ success: false, message: "Email not found" });

    return res.json({
      success: true,
      message: "You have successfully unsubscribed from our newsletter.",
    });
  } catch (error) {
    console.error("Unsubscribe Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Optional: Check if email is subscribed
export const checkSubscription = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.json({ subscribed: false });

    const subscriber = await Newsletter.findOne({ email });
    return res.json({ subscribed: !!subscriber });
  } catch (error) {
    console.error("Check Subscription Error:", error);
    return res.status(500).json({ subscribed: false });
  }
};


/*admin newsletter


export const sendNewsletter = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const subscribers = await Newsletter.find();

    for (const user of subscribers) {
      await resend.emails.send({
        from: `OCJ TECH <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject,
        html: `<h2>${subject}</h2><p>${message}</p><br/><p>— OCJ TECH Team</p>`,
      });
    }

    res.json({ success: true, message: "Newsletter sent to all subscribers!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to send newsletter" });
  }
};






*/