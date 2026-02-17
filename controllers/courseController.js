import Course from "../models/Course.js";


import mongoose from "mongoose";


// GET ALL COURSES 
export const getAllCourse = async (req, res) => {
  try {

    const courses = await Course.find({ isPublished: true })
      .select(["-courseContent", "-enrolledStudents"])
      .populate({ path: "educator" });

    res.status(200).json({
      success: true,
      courses,
    });

  } catch (error) {
    console.log("getAllCourse:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


//GET COURSE BY ID 
export const getCourseId = async (req, res) => {
  try {

    const { id } = req.params;

    // prevent MongoDB crash if id is invalid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course id",
      });
    }

    const courseData = await Course.findById(id).populate({ path: "educator" });

    // course not found
    if (!courseData) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove paid lecture URLs
    if (courseData.courseContent && courseData.courseContent.length > 0) {
      courseData.courseContent.forEach((chapter) => {
        chapter.chapterContent.forEach((lecture) => {
          if (!lecture.isPreviewFree) {
            lecture.lectureUrl = "";
          }
        });
      });
    }

    res.status(200).json({
      success: true,
      courseData,
    });

  } catch (error) {
    console.log("getCourseId:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
