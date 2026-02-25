import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";

export default function LoginRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [blockedPopup, setBlockedPopup] = useState(false);


  const initialForm = {
    registerNumber: "",
    teacherId: "",
    adminName: "",
    department: "",
    institution: "",
    name: "",
    password: "",
    semester: "",
  };

  const [form, setForm] = useState(initialForm);

  const resetForm = () => setForm(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "registerNumber" ? value.toUpperCase() : value });
    setError("");
  };

  const roles = [
    { key: "student", label: "Student", icon: GraduationCap },
    { key: "faculty", label: "Faculty", icon: Users },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let endpoint, payload;

      if (mode === "login") {
        endpoint = "http://localhost:5000/auth/login";
        const idField =
          role === "student"
            ? form.registerNumber
            : role === "faculty"
              ? form.teacherId
              : form.adminName;
        payload = { role, id: idField, password: form.password };
      } else {
        // Name validation for student and faculty
        const nameRegex = /^[A-Za-z\s]+$/;
        if ((role === "student" || role === "faculty") && !nameRegex.test(form.name)) {
          showToast("Full Name must contain only alphabetical characters and spaces.", "error");
          setLoading(false);
          return;
        }

        if (role === "student") {
          endpoint = "http://localhost:5000/auth/students/register";
          payload = {
            registerNumber: form.registerNumber,
            name: form.name,
            semester: form.semester,
            department: form.department,
            password: form.password,
          };
        } else if (role === "faculty") {
          endpoint = "http://localhost:5000/auth/faculty/register";
          payload = {
            teacherId: form.teacherId,
            name: form.name,
            department: form.department,
            password: form.password,
          };
        } else {
          endpoint = "http://localhost:5000/auth/admin/register";
          payload = {
            username: form.adminName,
            department: form.department,
            institution: form.institution,
            password: form.password,
          };
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check for admin-disabled account
        if (res.status === 403 && data.code === "ACCOUNT_DISABLED") {
          setBlockedPopup(true);
          setLoading(false);
          return;
        }
        setError(data.message || "Authentication failed");
        setLoading(false);
        return;
      }

      if (mode === "register") {
        setMode("login");
        setLoading(false);
        showToast("Registration successful! Please login.", "success");
        setIsLogin(true);
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.role === "student") navigate("/student-dashboard");
      else if (data.user.role === "faculty") navigate("/faculty-dashboard");
      else navigate("/admin-dashboard");
    } catch (err) {
      console.error(err);
      setError("Connection failed. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const roleData = {
    student: {
      image: "/assets/student_login.png",
      title: "Empowering Students,",
      subtitle: "One Point at a Time",
      description: "Manage your activity points, track certificates, and achieve your academic goals with ease.",
      badges: ["Point Tracking", "Real-time Updates", "Secure Portal"]
    },
    faculty: {
      image: "/assets/faculty_login.png",
      title: "Empowering Faculty,",
      subtitle: "One Click at a Time",
      description: "Streamline student point verification, manage departmental records, and focus on mentoring.",
      badges: ["Easy Verification", "Dept Management", "Secure Portal"]
    }
  };

  const currentRoleData = roleData[role] || roleData.student;

  return (<>
    <div className="min-h-screen flex bg-white lg:bg-gray-50 overflow-hidden">
      {/* Left Panel: Branding & Image (Desktop Only) */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gray-900 group">
        {/* Role-Specific Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${currentRoleData.image}')` }}
        />

        {/* Dynamic Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-900/40 to-transparent" />

        {/* Branding Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <span className="text-xl font-bold bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">A</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">AcadPoint</span>
          </div>

          <div className="max-w-xl animate-in delay-2">
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              {currentRoleData.title}
              <br />
              <span className="text-white/80">{currentRoleData.subtitle}</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 font-medium">
              {currentRoleData.description}
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap gap-3">
              {currentRoleData.badges.map((badge, idx) => (
                <div key={idx} className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck size={16} className="text-blue-400" />
                  {badge}
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-gray-400 font-medium">
            © 2026 AcadPoint CMS • Trusted by Universities
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md animate-in">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">AcadPoint</h1>
            </div>
            <p className="text-sm text-gray-500">Activity Point Management</p>
          </div>

          {/* Card */}
          <div className="liquid-glass rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Subtle reflection line for glass effect */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-50"></div>

            {/* Title */}
            <h2 className="text-xl font-bold text-gray-900 mb-1 relative z-10">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="text-sm text-gray-500 mb-6 relative z-10 font-medium">
              {role === "student" ? "Student Portal" : role === "faculty" ? "Faculty Portal" : "Admin Portal"}
            </p>

            {/* Role Tabs */}
            <div className="flex mb-6 bg-white/40 backdrop-blur-md rounded-xl p-1 gap-1 relative z-10 border border-white/40 shadow-inner">
              {roles.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setRole(key); resetForm(); setError(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${role === key
                    ? "bg-white text-gray-900 shadow-sm border border-white/60"
                    : "text-gray-600 hover:bg-white/30"
                    }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
              {mode === "register" && (
                <input
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  className="w-full clay-input"
                  onChange={handleChange}
                  required
                />
              )}

              {role === "student" && (
                <input
                  name="registerNumber"
                  placeholder="Register Number"
                  value={form.registerNumber}
                  className="w-full clay-input"
                  onChange={handleChange}
                  autoComplete="off"
                  required
                />
              )}

              {role === "faculty" && (
                <input
                  name="teacherId"
                  placeholder="Teacher ID"
                  value={form.teacherId}
                  className="w-full clay-input"
                  onChange={handleChange}
                  required
                />
              )}

              {role === "admin" && (
                <input
                  name="adminName"
                  placeholder="Admin Username"
                  value={form.adminName}
                  className="w-full clay-input"
                  onChange={handleChange}
                  required
                />
              )}

              {((role === "admin") || (role === "faculty" && mode === "register") || (role === "student" && mode === "register")) && (
                <select
                  name="department"
                  value={form.department}
                  className="w-full clay-input text-gray-600 bg-white/50 backdrop-blur-sm shadow-inner"
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  {["CSE", "Mech", "Eee", "Ai", "Ec", "Civil"].map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              )}

              {role === "admin" && (
                <input
                  name="institution"
                  placeholder="Institution"
                  value={form.institution}
                  className="w-full clay-input"
                  onChange={handleChange}
                  required
                />
              )}

              {role === "student" && mode === "register" && (
                <select
                  name="semester"
                  value={form.semester}
                  className="w-full clay-input text-gray-600 bg-white/50 backdrop-blur-sm shadow-inner"
                  onChange={handleChange}
                  required
                >
                  <option value="">Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Sem {s} ({s % 2 !== 0 ? "Odd" : "Even"})</option>
                  ))}
                </select>
              )}

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  className="w-full clay-input pr-10"
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <button
                disabled={loading}
                className="w-full clay-btn-dark py-3 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              {mode === "login" ? "No account?" : "Already registered?"}
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); resetForm(); setError(""); }}
                className="ml-1 text-gray-900 font-medium hover:underline"
              >
                {mode === "login" ? "Register" : "Sign In"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* ===== Blocked by Admin Popup ===== */}
    {
      blockedPopup && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setBlockedPopup(false)}>
          <div
            className="w-full max-w-xs bg-white rounded-2xl shadow-2xl overflow-hidden animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 w-full bg-gradient-to-r from-red-400 via-red-500 to-rose-500" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <ShieldOff size={20} className="text-red-500" />
                </div>
                <button
                  onClick={() => setBlockedPopup(false)}
                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition"
                >
                  <X size={14} />
                </button>
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Account Restricted</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                Your account has been disabled by the administrator. Please contact your institution admin for assistance.
              </p>
              <button
                onClick={() => setBlockedPopup(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )
    }
  </>);
}
