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
   FORGOT PASSWORD
========================= */
router.post("/forgot-password/:role", async (req, res) => {
  try {
    const { role } = req.params;
    const { id, email } = req.body;

    let user;
    if (role === "student") {
      user = await Student.findOne({ registerNumber: id });
      if (!user || user.email !== email) {
        return res.status(404).json({ message: "No account found with that ID and email." });
      }
    } else if (role === "faculty") {
      user = await Faculty.findOne({ facultyId: id });
      if (!user || user.email !== email) {
        return res.status(404).json({ message: "No account found with that ID and email." });
      }
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min
    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${role}/${token}`;

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
      subject: "Password Reset Request",
      html: `
        <p>Hello ${user.name},</p>
        <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.json({ message: "Reset link sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password/:role/:token", async (req, res) => {
  try {
    const { role, token } = req.params;
    const { password } = req.body;

    let user;
    const query = {
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    };

    if (role === "student") {
      user = await Student.findOne(query);
    } else if (role === "faculty") {
      user = await Faculty.findOne(query);
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;