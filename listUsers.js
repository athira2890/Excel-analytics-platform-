// listUsers.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
}, { collection: "users" }); // Make sure collection name matches

const User = mongoose.model("User", userSchema);

async function listUsers() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});
    console.log("Users in DB:");
    console.log(users);

    await mongoose.disconnect();
    console.log("✅ Disconnected");
  } catch (err) {
    console.error(err);
  }
}

listUsers();
