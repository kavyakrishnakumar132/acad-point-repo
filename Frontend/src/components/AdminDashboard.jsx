import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield, Users, GraduationCap, Building2, Clock, LogOut,
    Award, UserPlus, UserMinus, Pencil, Search, Bell, Settings,
    Activity, CheckCircle, AlertCircle, BarChart3, X, Loader2
} from "lucide-react";
import axios from "../api/axios";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem("user")) || {};
    const admin = {
        name: user.name || "Admin",
        role: "System Administrator",
        department: user.department || "All Departments",
        institution: user.institution || "University",
    };

    const [activeTab, setActiveTab] = useState("overview");
    const [search, setSearch] = useState("");
    const [userFilter, setUserFilter] = useState("all");
    const [showAddUser, setShowAddUser] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, departments: 0, pendingApprovals: 0, verificationStats: { total: 0, approved: 0, pending: 0, rejected: 0 } });
    const [allUsers, setAllUsers] = useState([]);
    const [togglingId, setTogglingId] = useState(null);

    const handleLogout = () => { sessionStorage.removeItem("user"); navigate("/"); };

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, studentsRes, teachersRes] = await Promise.all([
                axios.get("/users/dashboard-stats"),
                axios.get("/users/students"),
                axios.get("/users/teachers")
            ]);

            setStats(statsRes.data);

            const fetchedStudents = (studentsRes.data || []).map(s => ({
                id: s._id,
                name: s.name,
                type: "Student",
                regNo: s.registerNumber,
                department: `${s.department} (S${s.semester})`,
                status: s.status || "Active",
                points: s.points || 0
            }));

            const fetchedTeachers = (teachersRes.data || []).map(t => ({
                id: t._id,
                name: t.name,
                type: "Teacher",
                regNo: t.facultyId,
                department: t.department,
                status: t.status || "Active",
                points: null
            }));

            setAllUsers([...fetchedStudents, ...fetchedTeachers]);
        } catch (err) {
            console.error("Error fetching admin data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleStatus = async (userId, currentStatus) => {
        const newStatus = currentStatus === "Active" ? "Disabled" : "Active";
        setTogglingId(userId);
        try {
            await axios.put(`/users/${userId}/status`, { status: newStatus });
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            console.error("Failed to toggle status:", err);
        } finally {
            setTogglingId(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const activityRules = [
        { group: "Group I", name: "Co-curricular Activities", maxPoints: 40, categories: ["NSS/NCC/NSO", "Arts", "Sports & Games", "Club Activities"] },
        { group: "Group II", name: "Skill Development", maxPoints: 40, categories: ["Certifications", "Internships", "Workshops", "Hackathons", "Paper Presentations"] },
        { group: "Group III", name: "Research & Innovation", maxPoints: 40, categories: ["Publications", "Patents", "Start-ups", "Innovation", "Skilling Certificates"] },
    ];

    const verif = stats.verificationStats || { total: 0, approved: 0, pending: 0, rejected: 0 };

    const auditLogs = []; // Wait for backend audit log system

    const notifications = [];

    const filteredUsers = allUsers.filter((u) => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || (u.regNo || "").toLowerCase().includes(search.toLowerCase());
        const matchFilter = userFilter === "all"
            || (userFilter === "students" && u.type === "Student")
            || (userFilter === "teachers" && u.type === "Teacher")
            || (userFilter === "deactivated" && u.status === "Deactivated");
        return matchSearch && matchFilter;
    });

    const tabs = [
        { key: "overview", label: "Overview", icon: BarChart3 },
        { key: "users", label: "Users", icon: Users },
        { key: "rules", label: "Rules", icon: Settings },
        { key: "verification", label: "Verification", icon: CheckCircle },
        { key: "audit", label: "Audit Logs", icon: Activity },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
        );
    }

    /* ===== Overview ===== */
    const OverviewTab = () => (
        <div className="space-y-4 animate-in">
            <div className="grid grid-cols-4 gap-3">
                {[
                    { label: "Students", value: stats.totalStudents, icon: GraduationCap },
                    { label: "Teachers", value: stats.totalTeachers, icon: Users },
                    { label: "Departments", value: stats.departments, icon: Building2 },
                    { label: "Pending", value: stats.pendingApprovals, icon: Clock, color: "text-amber-600" },
                ].map((c) => {
                    const Icon = c.icon;
                    return (
                        <div key={c.label} className="bg-white/40 backdrop-blur border border-white/60 shadow-inner rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} className={c.color ? "text-amber-500" : "text-gray-500"} />
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{c.label}</p>
                            </div>
                            <p className={`text-3xl font-bold ${c.color || "text-gray-900"}`}>{c.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="clay-card p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                    {auditLogs.length > 0 ? auditLogs.slice(0, 4).map((log) => (
                        <div key={log.id} className="flex items-center gap-3 py-2 bg-white/40 backdrop-blur shadow-inner rounded-xl px-4 border border-white/60">
                            <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                                <Activity size={14} className="text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 truncate"><span className="font-bold text-gray-900">{log.action}</span> — {log.target}</p>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{log.user} • {log.time}</p>
                            </div>
                        </div>
                    )) : (
                        <div className="py-6 text-center">
                            <p className="text-xs font-semibold text-gray-500">No recent activity</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    /* ===== Users ===== */
    const UsersTab = () => (
        <div className="space-y-4 animate-in">
            <div className="clay-card p-3 flex gap-3">
                <div className="flex-1 flex items-center gap-2 bg-white/50 backdrop-blur-sm shadow-inner rounded-xl px-4 py-2 border border-white/60">
                    <Search size={16} className="text-gray-400" />
                    <input placeholder="Search users..." className="w-full bg-transparent outline-none text-sm text-gray-700 font-medium placeholder:text-gray-400" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="bg-white/50 backdrop-blur-sm shadow-inner border border-white/60 rounded-xl px-4 text-xs font-bold text-gray-600 outline-none">
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="teachers">Teachers</option>
                    <option value="deactivated">Deactivated</option>
                </select>
                <button onClick={() => setShowAddUser(!showAddUser)} className="flex items-center gap-1.5 px-4 py-2 clay-btn-dark rounded-xl text-xs font-medium">
                    <UserPlus size={16} /> Add
                </button>
            </div>

            {showAddUser && (
                <div className="clay-card p-5 animate-in">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Add New User</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Full Name" className="clay-input" />
                        <select className="clay-input text-gray-500">
                            <option>Role</option><option>Student</option><option>Teacher</option>
                        </select>
                        <input placeholder="ID / Reg No" className="clay-input" />
                        <select className="clay-input text-gray-500">
                            <option>Department</option><option>CSE</option><option>ECE</option><option>MECH</option><option>CIVIL</option><option>EEE</option><option>IT</option>
                        </select>
                        <input placeholder="Password" type="password" className="clay-input" />
                        <button className="clay-btn-dark py-3 text-sm font-bold">Create User</button>
                    </div>
                </div>
            )}

            <div className="clay-card overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-wider border-b border-white/40 bg-white/20 backdrop-blur-sm">
                            <th className="px-5 py-4 text-left">Name</th>
                            <th className="text-left">Type</th>
                            <th className="text-left">ID</th>
                            <th className="text-left">Dept</th>
                            <th className="text-center">Points</th>
                            <th className="text-center">Status</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="7" className="text-center py-10 text-xs font-semibold text-gray-500 bg-white/30 backdrop-blur">No users found.</td></tr>
                        ) : filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/40 backdrop-blur transition duration-300">
                                <td className="px-5 py-3.5 text-sm font-bold text-gray-900">{u.name}</td>
                                <td><span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-inner border border-white/60 ${u.type === "Student" ? "bg-blue-100/50 text-blue-700" : "bg-purple-100/50 text-purple-700"}`}>{u.type}</span></td>
                                <td className="text-xs font-medium text-gray-600">{u.regNo}</td>
                                <td className="text-xs font-medium text-gray-600">{u.department}</td>
                                <td className="text-center text-sm">{u.points !== null ? <span className={u.points >= 120 ? "text-green-600 font-bold" : u.points < 60 ? "text-red-500 font-bold" : "text-gray-800 font-bold"}>{u.points}</span> : <span className="text-gray-400 font-medium">—</span>}</td>
                                <td className="text-center"><span className={`text-[10px] font-bold px-2 py-1 rounded-md shadow-inner border border-white/60 ${u.status === "Active" ? "bg-green-100/50 text-green-700" : "bg-gray-200/50 text-gray-500"}`}>{u.status}</span></td>
                                <td className="text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <button
                                            onClick={() => toggleStatus(u.id, u.status)}
                                            disabled={togglingId === u.id}
                                            title={u.status === "Active" ? "Disable user" : "Enable user"}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border shadow-inner transition disabled:opacity-50 ${u.status === "Active"
                                                ? "bg-red-50/60 border-red-100 text-red-600 hover:bg-red-100/60"
                                                : "bg-green-50/60 border-green-100 text-green-600 hover:bg-green-100/60"
                                                }`}
                                        >
                                            {togglingId === u.id ? (
                                                <Loader2 size={12} className="animate-spin" />
                                            ) : u.status === "Active" ? (
                                                <><UserMinus size={12} /> Disable</>
                                            ) : (
                                                <><CheckCircle size={12} /> Enable</>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    /* ===== Rules ===== */
    const RulesTab = () => (
        <div className="animate-in">
            <div className="clay-card p-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">Activity Point Rules</h2>
                <p className="text-xs text-gray-500 font-medium mb-6">120 points mandatory • 3 groups (33.333% each) • Max 40 points each • Teachers assign points</p>
                <div className="space-y-4">
                    {activityRules.map((r) => (
                        <div key={r.group} className="bg-white/40 backdrop-blur shadow-inner rounded-xl p-5 border border-white/60">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-900">{r.group} — {r.name}</h3>
                                <div className="bg-white/50 border border-white/60 shadow-inner px-2 py-1 rounded-md">
                                    <span className="text-[10px] font-bold text-gray-600">Max {r.maxPoints} pts</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {r.categories.map((c) => (
                                    <span key={c} className="px-3 py-1.5 bg-white/60 border border-white/80 shadow-sm rounded-lg text-xs font-semibold text-gray-700">{c}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ===== Verification ===== */
    const VerificationTab = () => (
        <div className="animate-in">
            <div className="clay-card p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">Verification Overview</h2>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total", val: verif.total, color: "text-gray-900" },
                        { label: "Approved", val: verif.approved, color: "text-green-600" },
                        { label: "Pending", val: verif.pending, color: "text-amber-600" },
                        { label: "Rejected", val: verif.rejected, color: "text-red-600" },
                    ].map((v) => (
                        <div key={v.label} className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-4 text-center">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{v.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${v.color}`}>{v.val}</p>
                        </div>
                    ))}
                </div>
                {verif.total > 0 && (
                    <div className="w-full h-3 bg-gray-200 shadow-inner rounded-full overflow-hidden flex">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-500" style={{ width: `${(verif.approved / verif.total) * 100}%` }}></div>
                        <div className="h-full bg-gradient-to-r from-amber-300 to-amber-400" style={{ width: `${(verif.pending / verif.total) * 100}%` }}></div>
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: `${(verif.rejected / verif.total) * 100}%` }}></div>
                    </div>
                )}
                <div className="flex gap-5 mt-4 text-[10px] font-bold text-gray-500 justify-center">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 shadow-sm rounded-full"></span> Approved</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-400 shadow-sm rounded-full"></span> Pending</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-400 shadow-sm rounded-full"></span> Rejected</span>
                </div>
            </div>
        </div>
    );

    /* ===== Audit ===== */
    const AuditTab = () => (
        <div className="animate-in">
            <div className="clay-card p-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">Audit Logs</h2>
                <p className="text-xs text-gray-500 font-medium mb-5">System action history</p>
                <div className="space-y-3">
                    {auditLogs.length > 0 ? (
                        auditLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-3 py-3 px-4 bg-white/40 backdrop-blur shadow-inner rounded-xl border border-white/60">
                                <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                                    <Activity size={14} className="text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900"><span className="font-bold">{log.action}</span></p>
                                    <p className="text-xs font-medium text-gray-600 mt-0.5">{log.target}</p>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-1">by {log.user} • {log.time}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center">
                            <p className="text-xs font-semibold text-gray-500">No logs generated yet</p>
                        </div>
                    )}
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
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Admin Panel</p>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {tabs.map(({ key, label, icon: Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)} className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all focus:outline-none ${activeTab === key ? "bg-white/50 text-gray-900 font-bold shadow-inner border border-white/60" : "text-gray-600 hover:bg-white/30 font-medium"}`}>
                            <Icon size={18} className={activeTab === key ? "text-gray-900" : "text-gray-500"} /> {label}
                        </button>
                    ))}
                </nav>
                <div className="px-4 py-4 border-t border-white/30 bg-white/10 backdrop-blur-sm">
                    <div className="px-2 mb-3">
                        <p className="text-sm font-bold text-gray-900 truncate">{admin.name}</p>
                        <p className="text-[10px] font-semibold text-gray-500 truncate">{admin.role}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 font-bold hover:bg-white/40 transition">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="sticky top-0 z-10 liquid-glass px-8 py-5 mx-6 mt-2 rounded-2xl mb-6 flex items-center justify-between">
                    <h1 className="text-lg font-bold text-gray-900">
                        {activeTab === "overview" && "System Dashboard"}
                        {activeTab === "users" && "User Management Center"}
                        {activeTab === "rules" && "Activity Rules Configuration"}
                        {activeTab === "verification" && "Verification Statistics"}
                        {activeTab === "audit" && "System Audit Logs"}
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className="relative text-gray-400 hover:text-gray-600 transition">
                                <Bell size={18} />
                                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center">{notifications.length}</span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50 animate-in">
                                    <div className="px-3 py-2 border-b border-gray-100"><p className="text-xs font-semibold text-gray-900">Notifications</p></div>
                                    {notifications.map((n) => (
                                        <div key={n.id} className="px-3 py-2.5 hover:bg-gray-50 transition">
                                            <p className="text-xs text-gray-700">{n.text}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs font-bold text-gray-600 hidden md:block">{admin.name}</p>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-6 pb-10">
                    {activeTab === "overview" && OverviewTab()}
                    {activeTab === "users" && UsersTab()}
                    {activeTab === "rules" && RulesTab()}
                    {activeTab === "verification" && VerificationTab()}
                    {activeTab === "audit" && AuditTab()}
                </div>
            </div>
        </div>
    );
}
