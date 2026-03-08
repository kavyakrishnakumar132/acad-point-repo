import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Users, Upload, Award, LogOut, FileText,
  CheckCircle, Clock, AlertCircle, BarChart3, ChevronRight, ChevronLeft, Loader2
} from "lucide-react";
import CertificateUploadModal from "./CertificateUploadModal";
import axios from "../api/axios";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [uploadModal, setUploadModal] = useState({ open: false, group: "" });
  const [loading, setLoading] = useState(true);
  const [certsData, setCertsData] = useState([]);
  const [facultyData, setFacultyData] = useState([]);

  const user = JSON.parse(sessionStorage.getItem("user")) || {};

  const handleLogout = () => { sessionStorage.removeItem("user"); navigate("/"); };

  const fetchFaculty = useCallback(async () => {
    try {
      if (!user.department) return;
      const res = await axios.get(`/users/teachers?department=${user.department}`);
      setFacultyData(res.data);
    } catch (err) {
      console.error("Error fetching faculty:", err);
    }
  }, [user.department]);

  const fetchCertificates = useCallback(async () => {
    try {
      const studentId = user._id || user.id;
      if (!studentId) return;
      const res = await axios.get(`/certificates/student/${studentId}`);
      setCertsData(res.data);
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  }, [user._id, user.id]);

  useEffect(() => {
    fetchCertificates();
    fetchFaculty();
  }, [fetchCertificates, fetchFaculty]);

  // Derived state
  const group1Certs = certsData.filter(c => c.group === "Group I");
  const group2Certs = certsData.filter(c => c.group === "Group II");
  const group3Certs = certsData.filter(c => c.group === "Group III");

  const calcGroup = (certs) => {
    const earned = certs.filter(c => c.status === "Approved").reduce((sum, c) => sum + (c.points || 0), 0);
    const pending = certs.filter(c => c.status === "Pending").length;
    return { earned, pending, max: 40 };
  };

  const g1 = calcGroup(group1Certs);
  const g2 = calcGroup(group2Certs);
  const g3 = calcGroup(group3Certs);

  const totalEarned = g1.earned + g2.earned + g3.earned;
  const cappedEarned = Math.min(g1.earned, 40) + Math.min(g2.earned, 40) + Math.min(g3.earned, 40);
  const totalRequired = 120;
  const totalPct = Math.round((cappedEarned / totalRequired) * 100000) / 1000;

  const student = {
    name: user.name || "Student Name",
    regNo: user.registerNumber || "REG12345",
    semester: user.semester || 5,
    semType: user.semester ? (user.semester % 2 !== 0 ? "Odd" : "Even") : "Odd",
    earned: totalEarned,
    capped: cappedEarned,
    required: totalRequired,
    pct: totalPct > 100 ? 100 : totalPct,
    groups: { groupI: g1, groupII: g2, groupIII: g3 }
  };

  const certificates = {
    groupI: group1Certs,
    groupII: group2Certs,
    groupIII: group3Certs,
  };

  const tabs = [
    { key: "profile", label: "Profile", icon: User },
    { key: "faculty", label: "My Faculty", icon: Users },
    { key: "group1", label: "Group I", icon: Award },
    { key: "group2", label: "Group II", icon: FileText },
    { key: "group3", label: "Group III", icon: BarChart3 },
  ];

  const statusBadge = (status) => {
    const map = {
      Approved: "bg-green-50 text-green-600 border-green-100",
      Pending: "bg-amber-50 text-amber-600 border-amber-100",
      Rejected: "bg-red-50 text-red-600 border-red-100",
    };
    const icons = { Approved: CheckCircle, Pending: Clock, Rejected: AlertCircle };
    const Icon = icons[status] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${map[status] || map.Pending}`}>
        <Icon size={10} /> {status}
      </span>
    );
  };

  /* ===== Profile ===== */
  const ProfileTab = () => (
    <div className="space-y-4 animate-in">
      {/* Info */}
      <div className="clay-card p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner rounded-xl flex items-center justify-center text-white text-lg font-bold">
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{student.name}</h2>
            <p className="text-xs text-gray-500 font-medium">{student.regNo} • Semester {student.semester} ({student.semType})</p>
            {user.tutorName && (
              <p className="text-[10px] text-gray-400 font-semibold mt-1">Tutor: {user.tutorName}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Earned</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{student.earned}</p>
          </div>
          <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Required</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{student.required}</p>
          </div>
          <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
            <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Progress</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{student.pct}%</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-4">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-600 font-medium">Overall Progress</span>
            <span className="font-bold text-gray-800">{student.earned}/{student.required}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 shadow-inner rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-700 to-gray-900 rounded-full animate-progress" style={{ width: `${student.pct}%` }}></div>
          </div>
          <p className="text-[10px] text-gray-500 font-medium mt-2">
            {student.required - student.earned > 0 ? `${student.required - student.earned} more points needed` : "Completion achieved!"}
          </p>
        </div>
      </div>

      {/* Group cards */}
      <div className="grid grid-cols-1 gap-4">
        {[
          { key: "groupI", label: "Group I", sub: "Co-curricular", tab: "group1" },
          { key: "groupII", label: "Group II", sub: "Skills", tab: "group2" },
          { key: "groupIII", label: "Group III", sub: "Research", tab: "group3" },
        ].map(({ key, label, sub, tab }) => {
          const g = student.groups[key];
          const cappedEarned = Math.min(g.earned, g.max);
          const groupPercentage = Math.round((cappedEarned / g.max) * 33.33 * 10) / 10;

          return (
            <button
              key={key}
              onClick={() => setActiveTab(tab)}
              className="text-left clay-card p-5 group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-bold text-gray-900">{label}</p>
                  <div className="w-5 h-5 rounded-full bg-white/50 shadow-inner flex items-center justify-center group-hover:bg-white transition">
                    <ChevronRight size={12} className="text-gray-400 group-hover:text-gray-700" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-3 md:mb-0">{sub}</p>
              </div>

              <div className="flex-1 w-full md:px-6">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Group Progress</p>
                  <p className="text-sm font-bold text-gray-900">{groupPercentage}% <span className="text-[10px] text-gray-400 font-medium normal-case">of 33.3% total contribution</span></p>
                </div>
                <div className="w-full h-2 bg-gray-200 shadow-inner rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gray-700 to-gray-900 rounded-full" style={{ width: `${Math.min((g.earned / g.max) * 100, 100)}%` }}></div>
                </div>
              </div>

              <div className="flex flex-col items-end min-w-[100px]">
                <p className="text-3xl font-bold text-gray-900">{g.earned}<span className="text-sm text-gray-400 font-medium">/{g.max}</span></p>
                {g.pending > 0 && (
                  <div className="mt-1 bg-amber-50 shadow-inner rounded-md py-1 px-2 mb-0 inline-flex items-center justify-center gap-1 border border-amber-100">
                    <Clock size={10} className="text-amber-500" />
                    <span className="text-[10px] text-amber-600 font-bold">{g.pending} pending</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ===== Faculty Tab ===== */
  const FacultyTab = () => (
    <div className="space-y-4 animate-in">
      <div className="clay-card p-5">
        <h2 className="text-lg font-bold text-gray-900">Department Faculty</h2>
        <p className="text-xs text-gray-500 font-medium mt-1">Faculty members in the {user.department || "your"} department.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facultyData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-10 col-span-2">No faculty found for your department.</p>
        ) : (
          facultyData.map((f) => (
            <div key={f._id} className="clay-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl flex items-center justify-center text-white font-bold">
                {f.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{f.name}</h3>
                <p className="text-[10px] text-gray-500 font-medium">{f.department} • Faculty ID: {f.facultyId || f.teacherId}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  /* ===== Group Tab ===== */
  const GroupTab = ({ groupName, groupKey, groupData, description }) => {
    const certs = certificates[groupKey] || [];
    const groupMax = 120;
    const cappedGroupPoints = Math.min(groupData.earned, 40);
    const pct = Math.round((cappedGroupPoints / groupMax) * 100000) / 1000;

    return (
      <div className="space-y-5 animate-in">
        <div className="clay-card p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{groupName}</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">{description}</p>
            </div>
            <div className="bg-white/50 backdrop-blur border border-white shadow-inner px-3 py-1 rounded-lg">
              <p className="text-xl font-bold text-gray-900">{pct}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Earned</p>
              <p className="text-xl font-bold text-gray-900">{groupData.earned}</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Max</p>
              <p className="text-xl font-bold text-gray-900">{groupData.max}</p>
            </div>
            <div className="bg-white/40 backdrop-blur-sm border border-white/60 shadow-inner rounded-xl p-3">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pending</p>
              <p className="text-xl font-bold text-amber-600">{groupData.pending}</p>
            </div>
          </div>

          <div className="w-full h-2.5 bg-gray-200 shadow-inner rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-gray-700 to-gray-900 rounded-full animate-progress" style={{ width: `${pct}%` }}></div>
          </div>

          <button
            onClick={() => setUploadModal({ open: true, group: groupName })}
            className="w-full clay-btn-dark py-3.5 text-sm flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Submit Certificate Request
          </button>
        </div>

        {/* Certificate list */}
        <div className="clay-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Submitted Certificates</h3>
            <span className="text-[10px] font-bold text-gray-500 bg-white/50 shadow-inner px-2 py-1 rounded-md border border-white/60">{certs.length} total</span>
          </div>

          {certs.length === 0 ? (
            <div className="bg-white/30 backdrop-blur border border-white/50 shadow-inner rounded-xl py-10 flex flex-col items-center justify-center text-center">
              <FileText size={24} className="text-gray-400 mb-2 opacity-50" />
              <p className="text-xs font-semibold text-gray-500">No certificates submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {certs.map((cert) => (
                <div key={cert._id} className="bg-white/40 backdrop-blur shadow-inner border border-white/60 rounded-xl p-4 flex items-center justify-between hover:bg-white/60 transition duration-300">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{cert.certificateName}</p>
                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">{cert.activityType} • {new Date(cert.createdAt).toLocaleDateString()}</p>
                    {cert.remarks && <p className="text-[10px] font-semibold text-red-500 mt-1">Remarks: {cert.remarks}</p>}
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    {cert.points !== null && (
                      <span className="text-sm font-bold text-gray-900 bg-white/50 shadow-inner px-2 py-0.5 border border-white/60 rounded-md">{cert.points} pts</span>
                    )}
                    {cert.points === null && cert.status === "Pending" && (
                      <span className="text-[10px] font-medium text-gray-400 italic">Awaiting points</span>
                    )}
                    {statusBadge(cert.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  /* ===== Main ===== */
  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Sidebar */}
      <div className="w-56 liquid-glass flex flex-col h-screen sticky top-0 border-r-0 rounded-r-3xl my-2 ml-2 shadow-2xl z-20 overflow-hidden">
        <div className="px-5 py-6 border-b border-white/30 backdrop-blur-sm bg-white/10">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">AcadPoint</h2>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">Student Portal</p>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm transition-all focus:outline-none ${activeTab === key
                ? "bg-white/50 text-gray-900 font-bold shadow-inner border border-white/60"
                : "text-gray-600 hover:bg-white/30 font-medium"
                }`}
            >
              <Icon size={18} className={activeTab === key ? "text-gray-900" : "text-gray-500"} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/30 bg-white/10 backdrop-blur-sm">
          <div className="px-2 mb-3">
            <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
            <p className="text-[10px] font-semibold text-gray-500">{student.regNo}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-600 font-bold hover:bg-white/40 transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="sticky top-0 z-10 liquid-glass px-8 py-5 mx-6 mt-2 rounded-2xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {activeTab !== "profile" && (
              <button
                onClick={() => setActiveTab("profile")}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/50 border border-white shadow-inner text-gray-500 hover:text-gray-900 transition hover:bg-white"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">
              {activeTab === "profile" && "Profile Dashboard"}
              {activeTab === "faculty" && "Department Faculty"}
              {activeTab === "group1" && "Group I — Co-curricular"}
              {activeTab === "group2" && "Group II — Skills"}
              {activeTab === "group3" && "Group III — Research"}
            </h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pb-10">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "faculty" && <FacultyTab />}
          {activeTab === "group1" && <GroupTab groupName="Group I" groupKey="groupI" groupData={student.groups.groupI} description="NSS/NCC/NSO, Arts, Sports, Games, Clubs" />}
          {activeTab === "group2" && <GroupTab groupName="Group II" groupKey="groupII" groupData={student.groups.groupII} description="Certifications, Internships, Workshops, Hackathons" />}
          {activeTab === "group3" && <GroupTab groupName="Group III" groupKey="groupIII" groupData={student.groups.groupIII} description="Publications, Patents, Start-ups, Innovation" />}
        </div>
      </div>

      <CertificateUploadModal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false, group: "" })}
        groupName={uploadModal.group}
        onUploadSuccess={fetchCertificates}
      />
    </div>
  );
}