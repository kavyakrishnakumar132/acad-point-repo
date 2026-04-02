import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto"
import nodemailer from "nodemailer";

import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";
import Admin from "../models/adminSchema.js";

const router = express.Router();

/* =========================
   LOGIN  (Student / Faculty / Admin)
========================= */
router.post("/login", async (req, res) => {
  try {
    const { role, id, password } = req.body;

    let user;

    if (role === "student") {
      user = await Student.findOne({ registerNumber: id }).populate("tutorId", "name");
    } else if (role === "faculty") {
      user = await Faculty.findOne({ facultyId: id });
    } else if (role === "admin") {
      user = await Admin.findOne({ username: id });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Check if account is disabled by admin
    if (user.status === "Disabled") {
      return res.status(403).json({
        message: "Your account has been disabled by the administrator.",
        code: "ACCOUNT_DISABLED"
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name || user.username,
        role: user.role,
        semester: user.semester || null,
        department: user.department || null,
        institution: user.institution || null,
        registerNumber: user.registerNumber || null,
        tutorId: user.tutorId ? user.tutorId._id : null,
        tutorName: user.tutorId ? user.tutorId.name : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   STUDENT REGISTER
========================= */
router.post("/students/register", async (req, res) => {
  try {
    const { registerNumber, name, semester, department, email, password, tutorId } = req.body;

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name must contain only alphabetical characters and spaces" });
    }

    const exists = await Student.findOne({ registerNumber });
    if (exists) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const emailExists = await Student.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Student.create({
      registerNumber,
      name,
      semester,
      department,
      email,
      password: hashedPassword,
      tutorId,
    });

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   FACULTY REGISTER
========================= */
router.post("/faculty/register", async (req, res) => {
  try {
    const { teacherId, name, department, email, password } = req.body;

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name must contain only alphabetical characters and spaces" });
    }

    const exists = await Faculty.findOne({ facultyId: teacherId });
    if (exists) {
      return res.status(400).json({ message: "Faculty already exists" });
    }

    const emailExists = await Faculty.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Faculty.create({
      facultyId: teacherId,
      name,
      department,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Faculty registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET FACULTY BY DEPARTMENT
   (For registration dropdown)
========================= */
router.get("/faculty/:department", async (req, res) => {
  try {
    const { department } = req.params;
    const faculty = await Faculty.find({ department, status: "Active" }, "_id name");
    res.json(faculty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   GET FACULTY BY DEPARTMENT
   (For registration dropdown)
========================= */
router.get("/faculty/:department", async (req, res) => {
  try {
    const { department } = req.params;
    const faculty = await Faculty.find({ department, status: "Active" }, "_id name");
    res.json(faculty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ADMIN REGISTER
========================= */
router.post("/admin/register", async (req, res) => {
  try {
    const { username, department, institution, password } = req.body;

    const exists = await Admin.findOne({ username });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      username,
      department,
      institution,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin registration successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   FORGOT PASSWORD (OTP)
========================= */
router.post("/forgot-password/:role", async (req, res) => {
  const { role } = req.params;
  const { id, email } = req.body;
  let user;

  try {

    if (role === "student") {
      user = await Student.findOne({ registerNumber: id });
    } else if (role === "faculty") {
      user = await Faculty.findOne({ facultyId: id });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user || user.email !== email) {
      return res.status(404).json({ message: "No account found with that ID and email." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 10; // 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"AcadPoint" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Password Reset OTP",
      html: `
        <p>Hello ${user.name},</p>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes. Please enter it on the reset password page.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    res.json({ message: "An OTP has been sent to your email." });
  } catch (err) {
    console.error("Forgot Password Error:", err.message || err);
    // MOCK OTP FOR LOCAL TESTING IF EMAIL FAILS
    if (err.code === 'EAUTH' || err.responseCode === 535) {
      console.log(`\n\n=== DEMO MODE ===\nEmail failed due to invalid credentials.\nYour OTP for ${email} is: ${user.resetPasswordToken}\n=================\n\n`);
      return res.json({ message: "Email failed but OTP generated in server console for testing." });
    }
    res.status(500).json({ message: "Failed to send email. Please try again later." });
  }
});

/* =========================
   VERIFY OTP
========================= */
router.post("/verify-otp/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { id, email, otp } = req.body;

    let user;
    if (role === "student") {
      user = await Student.findOne({ registerNumber: id, email });
    } else if (role === "faculty") {
      user = await Faculty.findOne({ facultyId: id, email });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "No account found." });
    }

    if (user.resetPasswordToken !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    res.json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

/* =========================
   RESET PASSWORD (OTP)
========================= */
router.post("/reset-password-otp/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { id, otp, password } = req.body;

    let user;
    let query = {
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: Date.now() },
    };

    if (role === "student") {
      query.registerNumber = id;
      user = await Student.findOne(query);
    } else if (role === "faculty") {
      query.facultyId = id;
      user = await Faculty.findOne(query);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(400).json({ message: "OTP is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;