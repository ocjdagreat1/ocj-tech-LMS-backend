import mongoose from "mongoose";


//connect to the MONGODB DATABASE

const connectDB = async ()=>{
  mongoose.connection.on('connected',()=> console.log('Database Connected'))

  await mongoose.connect(`${process.env.MONGODB_URI }/ocjlms`)
}

export default connectDB