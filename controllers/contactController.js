import resend from "../configs/resend.js";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // basic validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // SEND EMAIL TO YOU
    await resend.emails.send({
      from: `OCJ TECH <${process.env.EMAIL_FROM}>`,
      to: process.env.CONTACT_RECEIVER, // your real inbox
      reply_to: email, // VERY IMPORTANT (you can reply to user)
      subject: `Website Contact: ${subject}`,

      html: `
        <div style="font-family: Arial; line-height:1.6">
          <h2>📩 New Contact Message</h2>

          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>

          <hr/>

          <h3>Message:</h3>
          <p>${message}</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: "Message sent successfully!",
    });

  } catch (error) {
    console.log("CONTACT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};
