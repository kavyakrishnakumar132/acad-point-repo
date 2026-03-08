import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function ResetPassword() {
  const { role, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password !== confirm) {
      return setError("Passwords do not match");
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `/api/auth/reset-password/${role}/${token}`,
        { password }
      );
      setMessage(res.data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold mb-2 text-black">Reset Password</h2>
        <p className="text-gray-500 mb-6">Enter your new password below</p>

        {message && (
          <p className="text-green-600 bg-green-50 p-3 rounded mb-4">{message}</p>
        )}
        {error && (
          <p className="text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>
        )}

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-900 transition font-bold"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}