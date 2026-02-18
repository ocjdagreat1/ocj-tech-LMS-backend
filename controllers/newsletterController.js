import Newsletter from "../models/Newsletter.js";
import transporter from "../configs/mailer.js";

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const existing = await Newsletter.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already subscribed" });

    const newSubscriber = new Newsletter({ email });
    await newSubscriber.save();

    // Send confirmation email
    await transporter.sendMail({
      from: `"OCJ TECH Newsletter" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Thank you for subscribing!",
      html: `
        <h2>Welcome to OCJ TECH!</h2>
        <p>Thank you for subscribing to our newsletter. You'll now receive the latest news, articles, and resources directly in your inbox.</p>
        <p>— The OCJ TECH Team</p>
      `,
    });

    return res.json({ success: true, message: "Subscribed successfully, confirmation email sent!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
