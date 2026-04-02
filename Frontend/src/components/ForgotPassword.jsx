import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function ForgotPassword() {
  const { userRole } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(userRole || "student");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userRole) {
      setRole(userRole);
    }
  }, [userRole]);

  const handleSendOtp = async () => {
    if (!id || !email) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const endpoint = `/auth/forgot-password/${role}`;
      const payload = role === "student" ? { id, email } : { id, email };

      const res = await axios.post(endpoint, payload);
      setMessage(res.data.message);
      setStep(2); // Move to OTP verification
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong sending the OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const endpoint = `/auth/verify-otp/${role}`;
      const payload = { id, email, otp };

      const res = await axios.post(endpoint, payload);
      setMessage(res.data.message);
      setStep(3); // Move to set new password
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP or something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const endpoint = `/auth/reset-password-otp/${role}`;
      const payload = { id, otp, password: newPassword };

      const res = await axios.post(endpoint, payload);
      setMessage(res.data.message + " Redirecting to login...");
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong resetting the password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-2 text-black">Forgot Password</h2>
        <p className="text-gray-500 mb-6">
          {step === 1 && "Enter your details to receive an OTP"}
          {step === 2 && "Enter the OTP sent to your email"}
          {step === 3 && "Create a new password"}
        </p>

        {message && (
          <p className="text-green-600 bg-green-50 p-3 rounded mb-4">{message}</p>
        )}
        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>
        )}

        {/* --- STEP 1: REQUEST OTP --- */}
        {step === 1 && (
          <>
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
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-900 transition font-bold"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {/* --- STEP 2: VERIFY OTP --- */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
              maxLength={6}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-900 transition font-bold"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => {
                setStep(1);
                setMessage("");
                setError("");
              }}
              className="w-full mt-3 text-sm text-gray-600 hover:underline"
            >
              Back to change email
            </button>
          </>
        )}

        {/* --- STEP 3: NEW PASSWORD --- */}
        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-900 transition font-bold"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}

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