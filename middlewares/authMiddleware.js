import { clerkClient } from "@clerk/express";


//Middleware {protect Educator Route}
export const protectEducator = async(req, res, next)=>{

  try {
    const userId = req.auth.userId
    const response = await clerkClient.users.getUser(userId)

    if(response.publicMetadata.role !== 'educator'){
      return res.json({success:false, message: 'Unauthorized Access'})
    }
    next()

  } catch (error) {
    res.json({success:false, message:error.message})
  }
}


/*
import { clerkClient } from "@clerk/clerk-sdk-node";

// Middleware - Protect Educator Routes
export const protectEducator = async (req, res, next) => {
  try {

    // 1️⃣ Check authentication exists
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const userId = req.auth.userId;

    // 2️⃣ Get user from Clerk
    const user = await clerkClient.users.getUser(userId);

    // 3️⃣ Check role
    const role = user.publicMetadata?.role;

    if (role !== "educator") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized Access - Educators only"
      });
    }

    // 4️⃣ allow request
    next();

  } catch (error) {
    console.log("Educator Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

*/