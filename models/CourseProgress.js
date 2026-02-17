import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // Clerk userId
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    completed: { type: Boolean, default: false },
    lectureCompleted: [
      { type: String } // store lectureIds
    ],
  },
  { timestamps: true, minimize: false }
);

export const CourseProgress = mongoose.model("CourseProgress", courseProgressSchema);
