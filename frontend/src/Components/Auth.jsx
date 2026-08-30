import { useEffect, useState } from "react";
import supabase from "../lib/supabase";
import Login from "../pages/Login";
import SignUp from "../pages/Signup";

export default function Auth({ onAuthenticated = () => {} }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSignIn = async ({ email, password }) => {
    setIsSubmitting(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      onAuthenticated(data.user);
    } catch (err) {
      setAuthError(err.message || "Couldn't sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = async ({ fullName, email, password }) => {
    setIsSubmitting(true);
    setAuthError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (error) throw error;
      onAuthenticated(data.user);
    } catch (err) {
      setAuthError(err.message || "Couldn't create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "signup") {
    return (
      <SignUp
        onCreateAccount={handleCreateAccount}
        onGoToSignIn={() => {
          setAuthError("");
          setMode("login");
        }}
        authError={authError}
      />
    );
  }

  return (
    <Login
      onSignIn={handleSignIn}
      onForgotPassword={() => {
        // e.g. navigate("/forgot-password") or open a modal
      }}
      onGoToSignUp={() => {
        setAuthError("");
        setMode("signup");
      }}
      authError={authError}
    />
  );
}