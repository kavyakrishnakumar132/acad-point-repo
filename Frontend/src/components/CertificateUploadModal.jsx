import React, { useState } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle } from "lucide-react";
import axios from "../api/axios";

const groupCategories = {
    "Group I": [
        "NSS Activities", "NCC Activities", "NSO Activities",
        "Arts & Cultural Events", "Sports & Games", "Club Activities", "Other",
    ],
    "Group II": [
        "English Certification", "Aptitude Certification", "Internship (min 2 weeks)",
        "Workshop", "Conference", "Paper Presentation", "Hackathon", "Other",
    ],
    "Group III": [
        "Journal Publication", "Patent Filing", "Start-up / Entrepreneurship",
        "Innovation Project", "National Hackathon Winner", "International Hackathon Winner",
        "University Skilling Certificate", "Other",
    ],
};

export default function CertificateUploadModal({ isOpen, onClose, groupName, onUploadSuccess }) {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({
        certificateName: "",
        activityType: "",
        description: "",
    });
    const [uploaded, setUploaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const categories = groupCategories[groupName] || [];

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            // Enforce PDF only
            if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
                setError("Only PDF files are allowed. Please upload a valid certificate PDF.");
                e.target.value = "";
                return;
            }
            setError("");
            setFile(selected);
        }
    };

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const user = JSON.parse(sessionStorage.getItem("user")) || {};

            // Send file + metadata using FormData
            const formData = new FormData();
            formData.append("certificateFile", file);
            formData.append("studentId", user._id || user.id);
            formData.append("group", groupName);
            formData.append("activityType", form.activityType);
            formData.append("certificateName", form.certificateName);
            formData.append("description", form.description);

            await axios.post("/certificates/submit", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setUploaded(true);
            if (onUploadSuccess) onUploadSuccess();

            setTimeout(() => {
                handleReset();
            }, 1800);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to submit certificate. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setFile(null);
        setPreview(null);
        setForm({ certificateName: "", activityType: "", description: "" });
        setUploaded(false);
        setError("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleReset}>
            <div className="liquid-glass rounded-3xl w-full max-w-md mx-4 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/30">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Submit Certificate</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{groupName} • Points assigned by teacher</p>
                    </div>
                    <button onClick={handleReset} className="text-gray-300 hover:text-gray-500 transition" disabled={submitting}>
                        <X size={18} />
                    </button>
                </div>

                {uploaded ? (
                    <div className="p-10 text-center animate-in">
                        <CheckCircle className="text-green-500 mx-auto mb-4" size={48} />
                        <h3 className="text-lg font-bold text-gray-900">Request Submitted</h3>
                        <p className="text-sm text-gray-500 mt-2">Your teacher will review and assign points.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{error}</div>}

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Certificate Name</label>
                            <input
                                name="certificateName"
                                value={form.certificateName}
                                onChange={handleChange}
                                placeholder={
                                    groupName === "Group I" ? "e.g. NSS Camp Certificate" :
                                        groupName === "Group II" ? "e.g. Web Development Workshop" :
                                            "e.g. IEEE Conference Paper"
                                }
                                className="w-full clay-input disabled:opacity-50"
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Activity Type</label>
                            <select
                                name="activityType"
                                value={form.activityType}
                                onChange={handleChange}
                                className="w-full clay-input disabled:opacity-50 appearance-none"
                                required
                                disabled={submitting}
                            >
                                <option value="">Select type</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Description (optional)</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Brief description..."
                                rows={2}
                                className="w-full clay-input resize-none disabled:opacity-50"
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Certificate File <span className="normal-case text-red-500 font-semibold">(PDF only)</span></label>
                            {!file ? (
                                <label className="flex flex-col items-center justify-center w-full h-32 clay-card border-dashed border-2 border-gray-300 cursor-pointer hover:border-blue-400 transition-colors">
                                    <div className="p-3 bg-white/50 rounded-full mb-2 shadow-sm">
                                        <FileText className="text-blue-500" size={24} />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">Click to upload PDF</span>
                                    <span className="text-xs text-gray-500 mt-1">PDF only · Max 5MB</span>
                                    <input type="file" accept=".pdf,application/pdf" onChange={handleFileChange} className="hidden" required disabled={submitting} />
                                </label>
                            ) : (
                                <div className="flex items-center gap-4 bg-white/60 border border-white/80 shadow-inner rounded-2xl p-4">
                                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center shadow-sm">
                                        <FileText className="text-red-400" size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{file.name}</p>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                                    </div>
                                    {!submitting && (
                                        <button type="button" onClick={() => { setFile(null); setError(""); }} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/80 text-gray-400 hover:text-red-500 hover:bg-red-50 transition shadow-sm">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={submitting}
                                className="flex-1 clay-btn py-4 text-sm font-bold text-gray-500 hover:text-gray-900 border border-white bg-white/30 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex-[2] clay-btn-dark py-4 text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {submitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Upload size={18} />
                                )}
                                {submitting ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
