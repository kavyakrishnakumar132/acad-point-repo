import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import Certificate from "../models/certificateSchema.js";
import Student from "../models/studentSchema.js";
import Faculty from "../models/facultySchema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../../uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;
        if (ext === ".pdf" && mime === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed. Screenshots and images are not accepted."));
        }
    },
});

// 1. Submit a certificate (Student) — with real file upload
router.post("/submit", upload.single("certificateFile"), async (req, res) => {
    try {
        const { studentId, group, activityType, certificateName, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Certificate file is required" });
        }

        // Check student status
        const student = await Student.findById(studentId);
        if (!student || student.status === "Disabled") {
            return res.status(403).json({ error: "Account is disabled. Cannot submit certificates." });
        }

        const newCert = new Certificate({
            studentId,
            group,
            activityType,
            certificateName,
            description,
            filePath: req.file.filename,
        });

        await newCert.save();
        res.status(201).json({ message: "Certificate submitted successfully", certificate: newCert });
    } catch (error) {
        console.error("Error submitting certificate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 2. Get certificates for a specific student
router.get("/student/:studentId", async (req, res) => {
    try {
        const certs = await Certificate.find({ studentId: req.params.studentId }).sort({ createdAt: -1 });
        res.status(200).json(certs);
    } catch (error) {
        console.error("Error fetching student certificates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 3. Get pending certificates (for faculty)
router.get("/pending", async (req, res) => {
    try {
        const pendingCerts = await Certificate.find({ status: "Pending" })
            .populate("studentId", "name registerNumber semester")
            .sort({ createdAt: 1 });
        res.status(200).json(pendingCerts);
    } catch (error) {
        console.error("Error fetching pending certificates:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 4. Review certificate (Assign points and Approve/Reject)
router.put("/review/:id", async (req, res) => {
    try {
        const { status, points, remarks, verifiedBy } = req.body;

        // Find the certificate being reviewed
        const cert = await Certificate.findById(req.params.id);
        if (!cert) return res.status(404).json({ error: "Certificate not found" });

        // Check faculty status
        const faculty = await Faculty.findById(verifiedBy);
        if (!faculty || faculty.status === "Disabled") {
            return res.status(403).json({ error: "Account is disabled. Cannot review certificates." });
        }

        // If approving, enforce the 40-point cap per student per group
        if (status === "Approved") {
            const assignedPoints = Number(points);

            if (!assignedPoints || assignedPoints < 1 || assignedPoints > 40) {
                return res.status(400).json({ error: "Points must be between 1 and 40." });
            }

            // Sum all already-approved points for this student in the same group (excluding this cert)
            const existingApproved = await Certificate.find({
                studentId: cert.studentId,
                group: cert.group,
                status: "Approved",
                _id: { $ne: cert._id }
            });

            const alreadyEarned = existingApproved.reduce((sum, c) => sum + (c.points || 0), 0);
            const GROUP_MAX = 40;

            if (alreadyEarned + assignedPoints > GROUP_MAX) {
                const remaining = GROUP_MAX - alreadyEarned;
                return res.status(400).json({
                    error: `Cannot exceed ${GROUP_MAX} points for ${cert.group}. Student has already earned ${alreadyEarned} points in this group. You can assign at most ${remaining} more point(s).`
                });
            }
        }

        const updatedCert = await Certificate.findByIdAndUpdate(
            req.params.id,
            { status, points: status === "Approved" ? Number(points) : null, remarks, verifiedBy },
            { new: true }
        );

        res.status(200).json({ message: "Certificate reviewed successfully", certificate: updatedCert });
    } catch (error) {
        console.error("Error reviewing certificate:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 5. Get all certificates (for admin verification stats)
router.get("/all", async (req, res) => {
    try {
        const certs = await Certificate.find().populate("studentId", "name registerNumber");
        res.status(200).json(certs);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
