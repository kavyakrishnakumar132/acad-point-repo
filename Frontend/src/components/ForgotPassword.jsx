import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPassword() {
  const { userRole } = useParams();
  const [role, setRole] = useState(userRole || "student");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole) {
      setRole(userRole);
    }
  }, [userRole]);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const endpoint =
        role === "student"
          ? "/api/auth/forgot-password/student"
          : "/api/auth/forgot-password/faculty";

      const payload =
        role === "student"
          ? { registerNumber: id, email }
          : { facultyId: id, email };

      const res = await axios.post(endpoint, payload);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-2 text-black">Forgot Password</h2>
        <p className="text-gray-500 mb-6">Enter your details to receive a reset link</p>

        {message && (
          <p className="text-green-600 bg-green-50 p-3 rounded mb-4">{message}</p>
        )}
        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>
        )}

        {/* Role Selector */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setRole("student")}
            className={`flex-1 py-2 rounded-lg border transition font-semibold ${role === "student"
              ? "bg-black text-white border-black"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
          >
            Student
          </button>
          <button
            onClick={() => setRole("faculty")}
            className={`flex-1 py-2 rounded-lg border transition font-semibold ${role === "faculty"
              ? "bg-black text-white border-black"
              : "text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
          >
            Faculty
          </button>
        </div>

        {/* ID Field */}
        <input
          type="text"
          placeholder={role === "student" ? "Register Number" : "Faculty ID"}
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
        />

        {/* Email Field */}
        <input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-900 transition font-bold"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <p className="text-center mt-4 text-sm text-gray-500">
          Remembered?{" "}
          <Link to="/" className="text-black font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}