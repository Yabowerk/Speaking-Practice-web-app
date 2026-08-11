import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import './App.css'
import Home from "./pages/Home";
import Recording from "./pages/Recording";
import Results from "./pages/Results";
import History from "./pages/History";
import Auth from "./Components/Auth";
import supabase from "./lib/supabase";

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Recording" element={
          <ProtectedRoute session={session}>
            <Recording />
          </ProtectedRoute>
        } />
        <Route path="/Results" element={
          <ProtectedRoute session={session}>
            <Results />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute session={session}>
            <History />
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
