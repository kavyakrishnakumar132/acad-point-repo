import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
  {
    facultyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "faculty",
      immutable: true,
    },

    status: {
      type: String,
      enum: ["Active", "Disabled"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Faculty", facultySchema);
