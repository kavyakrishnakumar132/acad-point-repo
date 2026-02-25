import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginRegister from "./components/LoginRegister";
import AdminLogin from "./components/AdminLogin";
import StudentDashboard from "./components/StudentDashboard";
import FacultyDashboard from "./components/facultyDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import { ToastProvider } from "./context/ToastContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ToastProvider>
      <Routes>
        <Route path="/" element={<LoginRegister />} />
        <Route path="/admin" element={<AdminLogin />} />

        <Route path="/student-dashboard" element={
          <ProtectedRoute allowedRoles={["student"]}>
            <StudentDashboard />
          </ProtectedRoute>
        } />

        <Route path="/faculty-dashboard" element={
          <ProtectedRoute allowedRoles={["faculty"]}>
            <FacultyDashboard />
          </ProtectedRoute>
        } />

        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </ToastProvider>
  </BrowserRouter>
);
