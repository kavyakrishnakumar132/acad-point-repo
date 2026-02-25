import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  registerNumber: { type: String, required: true, unique: true },
  name: String,
  semester: Number,
  department: { type: String, required: true },
  password: String,
  role: { type: String, default: "student" },
  status: { type: String, enum: ["Active", "Disabled"], default: "Active" }
});

export default mongoose.model("Student", studentSchema);
