import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
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
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [blockedPopup, setBlockedPopup] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);

  const initialForm = {
    registerNumber: "",
    teacherId: "",
    adminName: "",
    department: "",
    institution: "",
    name: "",
    email: "",
    password: "",
    semester: "",
    tutorId: "",
  };

  const [form, setForm] = useState(initialForm);

  const resetForm = () => {
    setForm(initialForm);
    setStep(1);
  };

  const validateStep = () => {
    if (mode === "login") return true;

    if (role === "student") {
      if (step === 1) {
        if (!form.name || !form.registerNumber || !form.email) {
          showToast("Please fill all required fields", "error");
          return false;
        }
      } else if (step === 2) {
        if (!form.department || !form.semester || !form.tutorId) {
          showToast("Please select all academic details", "error");
          return false;
        }
      }
    } else if (role === "faculty") {
      if (step === 1) {
        if (!form.name || !form.teacherId || !form.email || !form.department) {
          showToast("Please fill all required fields", "error");
          return false;
        }
      }
    } else if (role === "admin") {
      if (step === 1) {
        if (!form.adminName || !form.department || !form.institution) {
          showToast("Please fill all required fields", "error");
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === "registerNumber" ? value.toUpperCase() : value });
    if (name === "department" && mode === "register" && role === "student") {
      fetchFaculty(value);
    }
    setError("");
  };

  const fetchFaculty = async (dept) => {
    if (!dept) {
      setFacultyList([]);
      return;
    }
    setLoadingFaculty(true);
    try {
      const { data } = await api.get(`/auth/faculty/${dept}`);
      setFacultyList(data);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    } finally {
      setLoadingFaculty(false);
    }
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
            email: form.email,
            semester: form.semester,
            department: form.department,
            password: form.password,
            tutorId: form.tutorId,
          };
        } else if (role === "faculty") {
          endpoint = "http://localhost:5000/auth/faculty/register";
          payload = {
            teacherId: form.teacherId,
            name: form.name,
            email: form.email,
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

      try {
        const { data } = await api.post(endpoint, payload);

        if (mode === "register") {
          setMode("login");
          setStep(1);
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
        const data = err.response?.data;
        if (err.response?.status === 403 && data?.code === "ACCOUNT_DISABLED") {
          setBlockedPopup(true);
          setLoading(false);
          return;
        }
        setError(data?.message || "Authentication failed");
        setLoading(false);
      }
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
      badges: ["Point Tracking", "Real-time Updates", "Secure Portal"],
    },
    faculty: {
      image: "/assets/faculty_login.png",
      title: "Empowering Faculty,",
      subtitle: "One Click at a Time",
      description: "Streamline student point verification, manage departmental records, and focus on mentoring.",
      badges: ["Easy Verification", "Dept Management", "Secure Portal"],
    },
  };

  const currentRoleData = roleData[role] || roleData.student;

  const totalSteps = role === "student" ? 3 : 2;

  const renderStepIndicator = () => {
    if (mode === "login") return null;
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {[...Array(totalSteps)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${step > i + 1 ? "w-8 bg-gray-500" : step === i + 1 ? "w-8 bg-black outline outline-2 outline-black" : "w-4 bg-gray-200"
              }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen flex bg-white lg:bg-gray-50 overflow-hidden">

        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-gray-900 group">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${currentRoleData.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 via-gray-900/40 to-transparent" />
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
              <div className="flex flex-wrap gap-3">
                {currentRoleData.badges.map((badge, idx) => (
                  <div key={idx} className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-semibold flex items-center gap-2">
                    <ShieldCheck size={16} className="text-black" />
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

        {/* Right Panel */}
        <div className="w-full lg:w-2/5 flex items-center justify-center p-6 lg:p-12 bg-white">
          <div className="w-full max-w-md animate-in">

            {/* Mobile Header */}
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
            <div className="liquid-glass rounded-3xl p-8 shadow-2xl relative overflow-hidden border border-white/40">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gray-400 via-gray-700 to-black opacity-80"></div>

              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mode === "login" ? "Welcome Back" : "Register"}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    {role === "student" ? "Student Portal" : role === "faculty" ? "Faculty Portal" : "Admin Portal"}
                  </p>
                </div>
                {mode === "register" && (
                  <div className="text-xs font-bold text-black bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                    Step {step} of {totalSteps}
                  </div>
                )}
              </div>

              {/* Role Tabs */}
              {mode === "login" && (
                <div className="flex mb-8 bg-gray-100/50 backdrop-blur-md rounded-2xl p-1.5 gap-1.5 relative z-10 border border-gray-200 shadow-inner">
                  {roles.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => { setRole(key); resetForm(); setError(""); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${role === key
                        ? "bg-white text-black shadow-md transform scale-[1.02] border border-gray-100"
                        : "text-gray-500 hover:bg-white/50"
                        }`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Step Indicator */}
              {renderStepIndicator()}

              {/* Error */}
              {error && (
                <div className="mb-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={step === totalSteps || mode === "login" ? handleSubmit : handleNext} className="space-y-4" autoComplete="off">
                <div className="relative overflow-hidden min-h-[180px]">
                  {/* STEP 1: PERSONAL / PRIMARY INFO */}
                  {(step === 1 || mode === "login") && (
                    <div className="space-y-4 animate-in">
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
                        <>
                          <input
                            name="teacherId"
                            placeholder="Teacher ID"
                            value={form.teacherId}
                            className="w-full clay-input"
                            onChange={handleChange}
                            required
                          />
                          {mode === "register" && (
                            <select
                              name="department"
                              value={form.department}
                              className="w-full clay-input text-gray-600 bg-white"
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Department</option>
                              {["CSE", "Mech", "Eee", "Ai", "Ec", "Civil"].map((dept) => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          )}
                        </>
                      )}

                      {role === "admin" && (
                        <>
                          <input
                            name="adminName"
                            placeholder="Admin Username"
                            value={form.adminName}
                            className="w-full clay-input"
                            onChange={handleChange}
                            required
                          />
                          {mode === "register" && (
                            <>
                              <select
                                name="department"
                                value={form.department}
                                className="w-full clay-input text-gray-600 bg-white"
                                onChange={handleChange}
                                required
                              >
                                <option value="">Select Department</option>
                                {["CSE", "Mech", "Eee", "Ai", "Ec", "Civil"].map((dept) => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                              <input
                                name="institution"
                                placeholder="Institution"
                                value={form.institution}
                                className="w-full clay-input"
                                onChange={handleChange}
                                required
                              />
                            </>
                          )}
                        </>
                      )}

                      {mode === "register" && (role === "student" || role === "faculty") && (
                        <input
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          value={form.email}
                          className="w-full clay-input"
                          onChange={handleChange}
                          required
                        />
                      )}

                      {mode === "login" && (
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 2 (STUDENT): ACADEMIC DETAILS */}
                  {mode === "register" && role === "student" && step === 2 && (
                    <div className="space-y-4 animate-in">
                      <select
                        name="department"
                        value={form.department}
                        className="w-full clay-input text-gray-600 bg-white"
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select Department</option>
                        {["CSE", "Mech", "Eee", "Ai", "Ec", "Civil"].map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>

                      <select
                        name="semester"
                        value={form.semester}
                        className="w-full clay-input text-gray-600 bg-white"
                        onChange={handleChange}
                        required
                      >
                        <option value="">Semester</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>Sem {s}</option>
                        ))}
                      </select>

                      <select
                        name="tutorId"
                        value={form.tutorId}
                        className="w-full clay-input text-gray-600 bg-white"
                        onChange={handleChange}
                        required
                        disabled={!form.department || loadingFaculty}
                      >
                        <option value="">{loadingFaculty ? "Loading Faculty..." : "Select Faculty Tutor"}</option>
                        {facultyList.map((f) => (
                          <option key={f._id} value={f._id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* FINAL STEP: PASSWORD */}
                  {mode === "register" && step === totalSteps && (
                    <div className="space-y-4 animate-in">
                      <p className="text-xs text-gray-500 font-medium mb-2">Secure your account with a strong password.</p>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Create Password"
                          value={form.password}
                          className="w-full clay-input pr-10"
                          onChange={handleChange}
                          autoComplete="new-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  {mode === "register" && step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 clay-btn py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                    >
                      Back
                    </button>
                  )}

                  <button
                    disabled={loading}
                    className={`${(mode === "register" && step > 1) ? "flex-1" : "w-full"} clay-btn-dark py-3.5 text-sm font-bold flex items-center justify-center gap-2 group`}
                  >
                    {loading ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing...</>
                    ) : (
                      <>
                        {mode === "login" ? "Sign In" : step === totalSteps ? "Complete Registration" : "Continue"}
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Links */}
              <div className="mt-8 text-center space-y-3 relative z-10">
                <p className="text-sm text-gray-500 font-medium">
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                  <button
                    onClick={() => { setMode(mode === "login" ? "register" : "login"); resetForm(); setError(""); }}
                    className="ml-2 text-black font-bold hover:text-gray-700 hover:underline transition-all"
                  >
                    {mode === "login" ? "Get Started" : "Sign In"}
                  </button>
                </p>

                {mode === "login" && (
                  <p>
                    <Link
                      to={`/forgot-password/${role}`}
                      className="text-xs text-gray-400 hover:text-gray-900 font-bold tracking-wide uppercase transition-colors"
                    >
                      Forgot Your Password?
                    </Link>
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Blocked by Admin Popup */}
      {blockedPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setBlockedPopup(false)}
        >
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
      )}
    </>
  );
}