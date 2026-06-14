import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";

import Header from "./components/shared/Header";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Profile from "./components/auth/Profile";
import Admin from "./components/auth/Admin";
import Forum from "./components/forum/Forum";
import NewPost from "./components/forum/NewPost";
import PostDetail from "./components/forum/PostDetail";
import Counselors from "./components/counselor/Counselors";
import ChatRoom from "./components/chat/ChatRoom";
import ChatQueue from "./components/counselor/ChatQueue";
import MoodTracker from "./components/mood/MoodTracker";
import Resources from "./components/resources/Resources";
import CounselorApply from "./components/counselor/CounselorApply";

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuthStore();
  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "var(--text-muted)" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {
  const { fetchMe } = useAuthStore();
  useEffect(() => { fetchMe(); }, []);

  return (
    <BrowserRouter>
      <Header />
      <main style={{ minHeight: "calc(100vh - 64px)" }}>
        <Routes>
          <Route path="/" element={<Forum />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/counselors" element={<Counselors />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/new-post" element={<ProtectedRoute roles={["user"]}><NewPost /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute roles={["user"]}><MoodTracker /></ProtectedRoute>} />
          <Route path="/counselor-apply" element={<ProtectedRoute roles={["user"]}><CounselorApply /></ProtectedRoute>} />
          <Route path="/chat-queue" element={<ProtectedRoute roles={["counselor", "admin"]}><ChatQueue /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
