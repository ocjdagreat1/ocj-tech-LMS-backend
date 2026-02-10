import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

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
export const stripeWebhooks = async()=>{
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
