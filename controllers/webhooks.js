


import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// ==================== CLERK WEBHOOK ====================
export const clerkWebhooks = async (req, res) => {
  try {
    console.log("🔵 Clerk webhook received at:", new Date().toISOString());
    console.log("Headers:", Object.keys(req.headers));
    
    // Get the raw body as a string
    const payload = req.body.toString();
    console.log("Payload length:", payload.length);
    
    const headers = req.headers;

    // Check if webhook secret exists
    if (!process.env.CLERK_WEBHOOK_SECRET) {
      console.error("❌ CLERK_WEBHOOK_SECRET is not set in environment variables");
      return res.status(500).json({ success: false, error: "Webhook secret not configured" });
    }

    // Verify the webhook signature
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    
    let evt;
    try {
      evt = whook.verify(payload, {
        "svix-id": headers["svix-id"],
        "svix-timestamp": headers["svix-timestamp"],
        "svix-signature": headers["svix-signature"],
      });
      console.log("✅ Webhook verification successful");
    } catch (verifyError) {
      console.error("❌ Webhook verification failed:", verifyError.message);
      return res.status(401).json({ success: false, error: "Webhook verification failed" });
    }

    const { data, type } = evt;
    
    console.log(`📌 Processing event type: ${type}`);
    console.log("User ID from Clerk:", data.id);
    console.log("Full data object:", JSON.stringify(data, null, 2));

    // Handle user.created event
    if (type === "user.created") {
      console.log("📝 Creating new user in database...");
      
      // Validate that we have a user ID
      if (!data.id) {
        console.error("❌ No user ID in webhook data");
        return res.status(400).json({ success: false, error: "No user ID provided" });
      }

      // Extract email safely (check multiple possible locations)
      let email = "";
      if (data.email_addresses && data.email_addresses.length > 0) {
        email = data.email_addresses[0].email_address || "";
      } else if (data.email) {
        email = data.email;
      } else if (data.primary_email_address) {
        email = data.primary_email_address;
      }
      
      // Extract name safely
      const firstName = data.first_name || data.firstName || "";
      const lastName = data.last_name || data.lastName || "";
      const name = `${firstName} ${lastName}`.trim() || "User";
      
      // Extract image safely
      const imageUrl = data.image_url || data.profile_image_url || "";

      console.log("Prepared user data:", {
        id: data.id,
        email: email || "No email",
        name: name,
        imageUrl: imageUrl || "No image"
      });

      try {
        // Check if user already exists
        let user = await User.findById(data.id);
        
        if (user) {
          console.log("User already exists, updating instead...");
          user.email = email || user.email;
          user.name = name || user.name;
          user.imageUrl = imageUrl || user.imageUrl;
          await user.save();
          console.log("✅ User updated successfully:", user._id);
        } else {
          // Create new user
          user = await User.create({
            _id: data.id,
            email: email || "pending-email@example.com",
            name: name,
            imageUrl: imageUrl,
          });
          console.log("✅ User created successfully:", user._id);
        }
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        console.error("Error name:", dbError.name);
        console.error("Error message:", dbError.message);
        throw dbError;
      }
    }

    // Handle user.updated event
    if (type === "user.updated") {
      console.log("📝 Updating user in database...");
      
      if (!data.id) {
        console.error("❌ No user ID in webhook data");
        return res.status(400).json({ success: false, error: "No user ID provided" });
      }

      // Extract updated data
      let email = "";
      if (data.email_addresses && data.email_addresses.length > 0) {
        email = data.email_addresses[0].email_address || "";
      } else if (data.email) {
        email = data.email;
      }
      
      const firstName = data.first_name || data.firstName || "";
      const lastName = data.last_name || data.lastName || "";
      const name = `${firstName} ${lastName}`.trim() || "User";
      const imageUrl = data.image_url || data.profile_image_url || "";

      try {
        const user = await User.findByIdAndUpdate(
          data.id,
          {
            email: email,
            name: name,
            imageUrl: imageUrl,
          },
          { new: true } // Return the updated document
        );

        if (user) {
          console.log("✅ User updated successfully:", user._id);
        } else {
          console.log("User not found, creating instead...");
          // Create if doesn't exist
          await User.create({
            _id: data.id,
            email: email || "pending-email@example.com",
            name: name,
            imageUrl: imageUrl,
          });
          console.log("✅ User created successfully:", data.id);
        }
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        throw dbError;
      }
    }

    // Handle user.deleted event
    if (type === "user.deleted") {
      console.log("🗑️ Deleting user from database:", data.id);
      
      try {
        const result = await User.findByIdAndDelete(data.id);
        if (result) {
          console.log("✅ User deleted successfully:", data.id);
        } else {
          console.log("User not found in database, nothing to delete");
        }
      } catch (dbError) {
        console.error("❌ Database error during deletion:", dbError);
        throw dbError;
      }
    }

    res.status(200).json({ success: true });
    
  } catch (err) {
    console.error("❌❌❌ UNHANDLED WEBHOOK ERROR:");
    console.error("Error name:", err.name);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    
    res.status(400).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// ==================== STRIPE WEBHOOK ====================
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  console.log("🔵 Stripe webhook received at:", new Date().toISOString());
  
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Construct the event using the raw body
    event = stripeInstance.webhooks.constructEvent(
      req.body,  // This is already a Buffer from express.raw()
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Stripe webhook verified, event type:", event.type);
    
  } catch (err) {
    console.error("❌ Stripe webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event based on its type
  switch (event.type) {
    
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      
      console.log("💰 Payment succeeded for intent:", paymentIntentId);
      
      try {
        // Get the checkout session to access metadata
        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1
        });
        
        if (sessions.data.length === 0) {
          console.log("No session found for payment intent:", paymentIntentId);
          break;
        }
        
        const session = sessions.data[0];
        const { purchaseId } = session.metadata;
        
        if (!purchaseId) {
          console.log("No purchaseId in session metadata");
          break;
        }
        
        console.log("Processing purchase:", purchaseId);
        
        // Find the purchase
        const purchaseData = await Purchase.findById(purchaseId);
        
        if (!purchaseData) {
          console.log("Purchase not found:", purchaseId);
          break;
        }
        
        // Find user and course
        const userData = await User.findById(purchaseData.userId);
        const courseData = await Course.findById(purchaseData.courseId.toString());
        
        if (!userData) {
          console.log("User not found:", purchaseData.userId);
          break;
        }
        
        if (!courseData) {
          console.log("Course not found:", purchaseData.courseId);
          break;
        }
        
        // Enroll student in course
        if (!courseData.enrolledStudents.includes(userData._id)) {
          courseData.enrolledStudents.push(userData._id);
          await courseData.save();
          console.log("Student added to course");
        }
        
        // Add course to user's enrolled courses
        if (!userData.enrolledCourses.includes(courseData._id)) {
          userData.enrolledCourses.push(courseData._id);
          await userData.save();
          console.log("Course added to user's enrolled courses");
        }
        
        // Update purchase status
        purchaseData.status = 'completed';
        await purchaseData.save();
        
        console.log("✅ Payment processing completed successfully for purchase:", purchaseId);
        
      } catch (dbError) {
        console.error("❌ Error processing payment success:", dbError);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;
      
      console.log("❌ Payment failed for intent:", paymentIntentId);
      
      try {
        // Get the checkout session to access metadata
        const sessions = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntentId,
          limit: 1
        });
        
        if (sessions.data.length === 0) {
          console.log("No session found for payment intent:", paymentIntentId);
          break;
        }
        
        const session = sessions.data[0];
        const { purchaseId } = session.metadata;
        
        if (!purchaseId) {
          console.log("No purchaseId in session metadata");
          break;
        }
        
        // Update purchase status to failed
        const purchaseData = await Purchase.findById(purchaseId);
        
        if (purchaseData) {
          purchaseData.status = 'failed';
          await purchaseData.save();
          console.log("Purchase status updated to failed:", purchaseId);
        } else {
          console.log("Purchase not found:", purchaseId);
        }
        
      } catch (dbError) {
        console.error("❌ Error processing payment failure:", dbError);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
};



/*import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

//Api controller Function to manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    const payload = req.body.toString();
    const headers = req.headers;

    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const event = whook.verify(payload, {
      "svix-id": headers["svix-id"],
      "svix-timestamp": headers["svix-timestamp"],
      "svix-signature": headers["svix-signature"],
    });

    const { data, type } = event;

    if (type === "user.created") {
      await User.create({
        _id: data.id, // Clerk userId
        email: data.email_addresses?.[0]?.email_address || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        imageUrl: data.image_url,
      });
    }

    if (type === "user.updated") {
      await User.findByIdAndUpdate(data.id, {
        email: data.email_addresses?.[0]?.email_address || "",
        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
        imageUrl: data.image_url,
      });
    }

    if (type === "user.deleted") {
      await User.findByIdAndDelete(data.id);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Clerk Webhook Error:", err);
    res.status(400).json({ success: false });
  }
};




const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
export const stripeWebhooks = async(req,res)=>{
  const sig = request.headers['stripe-signature'];
  let event;
  try{
    event = Stripe.webhooks.constructEvent(request.body,sig,process.env.STRIPE_SECRET_KEY);
  }
  catch(err){
    response.status(400).send(`Webhook Error: ${err.message}`)
  }


//Handle the event
switch(event.type){
  case 'payment_intent.succeeded':{
    const paymentIntent = event.data.object;
    const paymentIntentId = paymentIntent.id;
    const session = await stripeInstance.checkout.sessions.list({
      payment_intent:paymentIntentId
    })
    const{purchaseId}=session.data[0].metadata;
    const purchaseData = await Purchase.findById(purchaseId)
    const userData= await User.findById(purchaseData.userId)
    const courseData = await Course.findById(purchaseData.courseId.toString())

    courseData.enrolledStudents.push(userData)
    await courseData.save()

    userData.enrolledCourses.push(courseData._id)
    await userData.save()

    purchaseData.status = 'completed'
    await purchaseData.save()

    break;
  }


    case 'payment_intent.payment_failed':{
      
     const paymentIntent = event.data.object;
     const paymentIntentId = paymentIntent.id;

     const session = await stripeInstance.checkout.sessions.list({
      payment_intent:paymentIntentId
     })

     const {purchaseId} = session.data[0].metadata;
     const purchaseData = await Purchase.findById(purchaseId)
     purchaseData.status = 'failed'
     await purchaseData.save()

      break;
    }
      //...handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`)
}
//return a response to acknowledge receipt of the event
res.json({received:true});

}
*/