const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected successfully");

  } catch (error) {
    console.error("DB Connection Error:", error.message);
  }
};

module.exports = connectDB;

// dubeyanshul2204_db_user
// ul90J5P2FAHOmNoI
// mongodb+srv://dubeyanshul2204_db_user:ul90J5P2FAHOmNoI@cluster0.wc6uv7l.mongodb.net/?appName=Cluster0