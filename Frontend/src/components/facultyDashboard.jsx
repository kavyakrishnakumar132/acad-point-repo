import { useState, useEffect, useCallback } from "react";
import { useToast } from "../context/ToastContext";
import { useNavigate } from "react-router-dom";
import {
  LogOut, CheckCircle, XCircle, Search, FileText, Users,
  Clock, AlertTriangle, Eye, Bell, Award, X, BarChart3, Loader2
} from "lucide-react";
import axios from "../api/axios";

export default function FacultyDashboard() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user")) || {};
  const faculty = {
    name: user.name || "Dr. Rajesh Kumar",
    department: user.department || "Computer Science",
    id: user._id || user.id
  };

  const [activeTab, setActiveTab] = useState("myclass");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);

  const [loading, setLoading] = useState(true);
  const [studentsData, setStudentsData] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Action states for certificates
  const [reviewInput, setReviewInput] = useState({}); // { certId: { points: "", remarks: "" } }
  const [submittingId, setSubmittingId] = useState(null);

  // Student detail modal certificate state
  const [studentCerts, setStudentCerts] = useState([]);
  const [loadingCerts, setLoadingCerts] = useState(false);

  const handleLogout = () => { sessionStorage.removeItem("user"); navigate("/"); };

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, certsRes] = await Promise.all([
        axios.get(`/users/students?department=${faculty.department}`),
        axios.get("/certificates/pending")
      ]);
      setStudentsData(studentsRes.data || []);
      setPendingRequests(certsRes.data || []);
    } catch (err) {
      console.error("Error fetching faculty data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch certificates when a student is selected in the modal
  useEffect(() => {
    if (selectedStudent && selectedStudent._id) {
      setLoadingCerts(true);
      axios.get(`/certificates/student/${selectedStudent._id}`)
        .then(res => setStudentCerts(res.data || []))
        .catch(err => console.error("Error fetching student certs:", err))
        .finally(() => setLoadingCerts(false));
    } else {
      setStudentCerts([]);
    }
  }, [selectedStudent]);

  const handleReviewInput = (id, field, value) => {
    setReviewInput(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value }
    }));
  };

  // Helper: get total approved points for a student in a specific group from already-loaded data
  // (used for real-time UI hint; backend enforces the hard cap)
  const getGroupEarned = (studentId, group) => {
    // We don't have all approved certs loaded in pendingRequests, so we rely on
    // backend error for the hard block, but we can show a hint if visible in studentCerts
    return null; // backend is the source of truth
  };

  const submitReview = async (certId, status) => {
    const input = reviewInput[certId] || {};
    // Validation
    if (status === "Approved" && (!input.points || input.points < 1 || input.points > 40)) {
      showToast("Please assign valid points (1-40) before approving.", "warning");
      return;
    }

    setSubmittingId(certId);
    try {
      await axios.put(`/certificates/review/${certId}`, {
        status,
        points: status === "Approved" ? Number(input.points) : null,
        remarks: input.remarks || "",
        verifiedBy: faculty.id
      });
      showToast("Review submitted successfully.", "success");
      // Refresh data after successful review
      fetchData();
      // Clear input
      setReviewInput(prev => {
        const next = { ...prev };
        delete next[certId];
        return next;
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      // Show the backend's specific error message (e.g. group cap exceeded)
      const msg = err.response?.data?.error || "Failed to submit review.";
      showToast(msg, "error");
    } finally {
      setSubmittingId(null);
    }
  };

  // Group students by Semester instead of static "Section A/B" since schema only has semester
  const assignedClassesMap = studentsData.reduce((acc, st) => {
    const key = `Semester ${st.semester || "Unknown"}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push({
      regNo: st.registerNumber,
      name: st.name,
      total: st.points || 0,
      groupI: 0, // We don't have detailed breakdown in the current simple /users/students route, mock to 0 or calculate if returned
      groupII: 0,
      groupIII: 0,
      pendingCerts: pendingRequests.filter(req => req.studentId && req.studentId._id === st._id).length,
      _id: st._id
    });
    return acc;
  }, {});

  const assignedClasses = Object.keys(assignedClassesMap).map(key => ({
    className: key,
    semester: key.split(" ")[1],
    students: assignedClassesMap[key]
  }));

  const allStudents = assignedClasses.flatMap(c => c.students);
  const totalPending = pendingRequests.length;
  const lowStudents = allStudents.filter(s => s.total < 60).length;

  const filteredStudents = (students) =>
    students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.regNo.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterStatus === "all" || (filterStatus === "pending" && s.pendingCerts > 0) || (filterStatus === "low" && s.total < 60);
      return matchSearch && matchFilter;
    });

  const tabs = [
    { key: "myclass", label: "My Classes", icon: Users },
    { key: "requests", label: "Requests", icon: Clock, badge: totalPending },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  /* ===== My Classes Tab ===== */
  const MyClassesTab = () => (
    <div className="space-y-4 animate-in">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending Requests", value: totalPending, color: "text-amber-600" },
          { label: "Low Activity", value: lowStudents, color: "text-red-600" },
          { label: "Total Students", value: allStudents.length, color: "text-gray-900" },
          { label: "Classes Assigned", value: assignedClasses.length, color: "text-gray-900" },
        ].map((c) => (
          <div key={c.label} className="bg-white/40 backdrop-blur border border-white/60 shadow-inner rounded-2xl p-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{c.label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="clay-card p-3 flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/60 shadow-inner">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Search students..."
            className="w-full bg-transparent outline-none text-sm text-gray-700 font-medium placeholder:text-gray-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white/50 backdrop-blur-sm shadow-inner border border-white/60 rounded-xl px-4 text-xs font-bold text-gray-600 outline-none"
        >
          <option value="all">All</option>
          <option value="pending">Has Pending</option>
          <option value="low">Low Points</option>
        </select>
      </div>

      {/* Class-wise tables */}
      {assignedClasses.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No students assigned to you yet.</p>}

      {assignedClasses.map((cls) => {
        const students = filteredStudents(cls.students);
        if (students.length === 0) return null;
        return (
          <div key={cls.className} className="clay-card overflow-hidden">
            <div className="px-5 py-4 border-b border-white/40 bg-white/20 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-900">{cls.className}</h3>
              <p className="text-[10px] text-gray-500 font-medium">Semester {cls.semester} • {cls.students.length} students</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-gray-400 font-medium uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left">Reg No</th>
                  <th className="text-left">Name</th>
                  <th className="text-center">Total</th>
                  <th className="text-center">Pending</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s.regNo} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 text-xs font-medium text-gray-600">{s.regNo}</td>
                    <td className="text-xs text-gray-800 font-medium">{s.name}</td>
                    <td className="text-center">
                      <span className={`text-xs font-semibold ${s.total >= 120 ? "text-green-600" : s.total < 60 ? "text-red-600" : "text-gray-800"}`}>
                        {s.total}
                      </span>
                    </td>
                    <td className="text-center">
                      {s.pendingCerts > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[10px] font-medium">
                          <Clock size={9} /> {s.pendingCerts}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-300">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <button onClick={() => setSelectedStudent(s)} className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 mx-auto">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );

  /* ===== Requests Tab (assign points here) ===== */
  const RequestsTab = () => (
    <div className="space-y-4 animate-in">
      <div className="clay-card p-5">
        <h2 className="text-base font-bold text-gray-900">Certificate Requests</h2>
        <p className="text-xs text-gray-500 font-medium mt-1">{pendingRequests.length} requests awaiting your review. Assign points and approve or reject.</p>
      </div>

      {pendingRequests.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No pending requests.</p>}

      {pendingRequests.map((req) => {
        const isSubmitting = submittingId === req._id;
        const inputStr = reviewInput[req._id] || {};

        return (
          <div key={req._id} className="clay-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">{req.certificateName}</h3>
                {req.studentId && <p className="text-xs text-gray-500 font-medium mt-1">{req.studentId.name} • {req.studentId.registerNumber} • Sem {req.studentId.semester}</p>}
              </div>
              <span className="text-[10px] font-bold text-gray-600 bg-white/50 border border-white/60 shadow-inner px-2 py-1 rounded-md">{req.group}</span>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-gray-400 mb-3">
              <span className="flex items-center gap-1"><FileText size={10} /> {req.activityType}</span>
              <span>Submitted: {new Date(req.createdAt).toLocaleDateString()}</span>
            </div>

            {req.filePath && req.filePath !== "dummy/path.pdf" && (
              <div className="flex items-center gap-2 mb-3">
                <Eye size={13} className="text-gray-400" />
                <a
                  href={`http://localhost:5000/uploads/${req.filePath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  View Uploaded Certificate
                </a>
              </div>
            )}
            {req.description && (
              <div className="bg-white/30 backdrop-blur border border-white/50 shadow-inner rounded-xl p-3 mb-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Description</p>
                <p className="text-xs text-gray-700 font-medium">{req.description}</p>
              </div>
            )}

            {/* Group cap info banner */}
            <div className="bg-blue-50/60 backdrop-blur border border-blue-100/70 shadow-inner rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
              <Award size={13} className="text-blue-400 flex-shrink-0" />
              <p className="text-[10px] text-blue-700 font-semibold">
                <span className="font-bold">{req.group}</span> — max <span className="font-bold">40 points</span> per student. The system will block approval if this student&apos;s group total would exceed 40.
              </p>
            </div>

            {/* Assign Points + Remarks */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Assign Points * <span className="normal-case text-gray-400">(max 40/group)</span></label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  min="1"
                  max="40"
                  value={inputStr.points || ""}
                  onChange={(e) => handleReviewInput(req._id, "points", e.target.value)}
                  className="w-full clay-input"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1.5">Remarks</label>
                <input
                  placeholder="Optional"
                  value={inputStr.remarks || ""}
                  onChange={(e) => handleReviewInput(req._id, "remarks", e.target.value)}
                  className="w-full clay-input"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => submitReview(req._id, "Rejected")}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50/50 backdrop-blur border border-red-200/50 text-red-600 text-sm font-bold shadow-sm hover:bg-red-100/50 transition disabled:opacity-50"
              >
                <XCircle size={16} /> Reject
              </button>
              <button
                onClick={() => submitReview(req._id, "Approved")}
                disabled={isSubmitting}
                className="clay-btn-dark px-4 py-2 text-sm flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />} Approve & Assign
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ===== Reports Tab ===== */
  const ReportsTab = () => (
    <div className="space-y-4 animate-in">
      <div className="clay-card p-6">
        <h2 className="text-base font-bold text-gray-900 mb-5">Class-wise Summary</h2>
        <div className="grid grid-cols-3 gap-4 mb-2">
          <div className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Points</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{allStudents.length ? Math.round(allStudents.reduce((a, s) => a + s.total, 0) / allStudents.length) : 0}</p>
          </div>
          <div className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{allStudents.length ? Math.round(allStudents.filter(s => s.total >= 120).length / allStudents.length * 100) : 0}%</p>
          </div>
          <div className="bg-red-50/50 backdrop-blur shadow-inner border border-red-100/50 rounded-xl p-4">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">At Risk</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{lowStudents}</p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ===== Main ===== */
  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Sidebar */}
      <div className="w-56 liquid-glass flex flex-col h-screen sticky top-0 border-r-0 rounded-r-3xl my-2 ml-2 shadow-2xl z-20 overflow-hidden">
        <div className="px-5 py-6 border-b border-white/30 backdrop-blur-sm bg-white/10">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">AcadPoint</h2>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Teacher Portal</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map(({ key, label, icon: Icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all focus:outline-none ${activeTab === key ? "bg-white/50 text-gray-900 font-bold shadow-inner border border-white/60" : "text-gray-600 hover:bg-white/30 font-medium"
                }`}
            >
              <Icon size={18} className={activeTab === key ? "text-gray-900" : "text-gray-500"} />
              <span className="flex-1 text-left">{label}</span>
              {badge > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${activeTab === key ? "bg-gray-900 text-white" : "bg-amber-100/50 text-amber-700 shadow-inner"
                  }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/30 bg-white/10 backdrop-blur-sm">
          <div className="px-2 mb-3">
            <p className="text-sm font-bold text-gray-900 truncate">{faculty.name}</p>
            <p className="text-[10px] font-semibold text-gray-500 truncate">{faculty.department}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 font-bold hover:bg-white/40 transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 liquid-glass px-8 py-5 mx-6 mt-2 rounded-2xl mb-6 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            {activeTab === "myclass" && "My Classes Dashboard"}
            {activeTab === "requests" && "Certificate Review Center"}
            {activeTab === "reports" && "Class Performance Reports"}
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-400 hover:text-gray-600 transition">
                <Bell size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden md:block">{faculty.name}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 pb-10">
          {activeTab === "myclass" && MyClassesTab()}
          {activeTab === "requests" && RequestsTab()}
          {activeTab === "reports" && ReportsTab()}
        </div>
      </div>

      {/* Student detail modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="clay-card w-full max-w-sm mx-4 transform transition-all shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/40 bg-white/20">
              <div>
                <h2 className="text-base font-bold text-gray-900">{selectedStudent.name}</h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{selectedStudent.regNo}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-900 bg-white/50 shadow-inner rounded-full p-1"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-600 font-bold uppercase tracking-wide">Total Points</span>
                  <span className="font-bold text-gray-900">{selectedStudent.total}/120</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 shadow-inner rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${selectedStudent.total >= 120 ? "bg-green-500" : selectedStudent.total < 60 ? "bg-red-500" : "bg-gradient-to-r from-gray-700 to-gray-900"}`} style={{ width: `${Math.min((selectedStudent.total / 120) * 100, 100)}%` }}></div>
                </div>
              </div>
              {selectedStudent.pendingCerts > 0 && (
                <div className="bg-amber-50/80 backdrop-blur border border-amber-100 shadow-inner rounded-xl p-4 flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg text-amber-500 shadow-sm"><Clock size={16} /></div>
                  <span className="text-sm font-semibold text-amber-700">{selectedStudent.pendingCerts} certificates pending review</span>
                </div>
              )}

              {/* Student Certificates List */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Uploaded Certificates</h3>
                {loadingCerts ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-gray-400 animate-spin" /></div>
                ) : studentCerts.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No certificates uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentCerts.map(cert => (
                      <div key={cert._id} className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-3 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{cert.certificateName}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">{cert.activityType} • {cert.group} • {new Date(cert.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {cert.points !== null && <span className="text-[10px] font-bold text-gray-900 bg-white/50 shadow-inner px-1.5 py-0.5 border border-white/60 rounded-md">{cert.points} pts</span>}
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md border ${cert.status === "Approved" ? "bg-green-50 text-green-600 border-green-100" :
                            cert.status === "Rejected" ? "bg-red-50 text-red-600 border-red-100" :
                              "bg-amber-50 text-amber-600 border-amber-100"
                            }`}>{cert.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setSelectedStudent(null)} className="clay-btn w-full py-3 text-sm flex items-center justify-center">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
