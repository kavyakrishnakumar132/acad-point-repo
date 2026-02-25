import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2, Lock } from "lucide-react";

export default function AdminLogin() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({ adminName: "", password: "" });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:5000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: "admin", id: form.adminName, password: form.password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Authentication failed");
                setLoading(false);
                return;
            }

            sessionStorage.setItem("user", JSON.stringify(data.user));
            navigate("/admin-dashboard");
        } catch (err) {
            console.error(err);
            setError("Connection failed. Is the server running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm animate-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-900 shadow-xl mb-4">
                        <ShieldCheck size={26} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">AcadPoint</h1>
                    <p className="text-sm text-gray-400 mt-1 font-medium">Admin Portal</p>
                </div>

                {/* Card */}
                <div className="liquid-glass rounded-2xl p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-60"></div>

                    <h2 className="text-base font-bold text-gray-900 mb-0.5">Administrator Sign In</h2>
                    <p className="text-xs text-gray-400 font-medium mb-5">Restricted access — authorised personnel only</p>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                            <Lock size={13} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                        <input
                            name="adminName"
                            placeholder="Admin Username"
                            value={form.adminName}
                            className="w-full clay-input"
                            onChange={handleChange}
                            autoComplete="off"
                            required
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                value={form.password}
                                className="w-full clay-input pr-10"
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full clay-btn-dark py-3 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-gray-400 mt-5 font-medium tracking-wide uppercase">
                        This portal is for administrators only
                    </p>
                </div>
            </div>
        </div>
    );
}
