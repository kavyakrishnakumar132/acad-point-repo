import express from "express";
import bcrypt from "bcryptjs";

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
      user = await Student.findOne({ registerNumber: id });
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
    const { registerNumber, name, semester, department, password } = req.body;

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name must contain only alphabetical characters and spaces" });
    }

    const exists = await Student.findOne({ registerNumber });
    if (exists) {
      return res.status(400).json({ message: "Student already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Student.create({
      registerNumber,
      name,
      semester,
      department,
      password: hashedPassword,
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
    const { teacherId, name, department, password } = req.body;

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ message: "Name must contain only alphabetical characters and spaces" });
    }

    const exists = await Faculty.findOne({ facultyId: teacherId });
    if (exists) {
      return res.status(400).json({ message: "Faculty already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await Faculty.create({
      facultyId: teacherId,
      name,
      department,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Faculty registration successful" });
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

export default router;
