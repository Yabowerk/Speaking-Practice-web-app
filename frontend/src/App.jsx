import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import './App.css'
import Home from "./pages/Home";
import Recording from "./pages/Recording";
import Results from "./pages/Results";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Auth from "./Components/Auth";
import supabase from "./lib/supabase";
import PracticePage from "./pages/Pagepractice";

const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  const sessionx = true;

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/p" element={

          <PracticePage />

        } />
        <Route path="/" element={
          <ProtectedRoute session={session}>
            <Home />
          </ProtectedRoute>

        } />
        <Route path="/recording" element={
          <ProtectedRoute session={sessionx}>
            <Recording />
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute session={sessionx}>
            <Results />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute session={sessionx}>
            <History />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute session={sessionx}>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="/auth" element={
          session ? <Navigate to="/" replace /> : <Auth />
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
