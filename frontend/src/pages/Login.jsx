import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login({
  onSignIn,
  onForgotPassword = () => {},
  onGoToSignUp = () => {},
  authError = "",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSignIn) {
      onSignIn({ email, password });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[600px] sm:min-h-[640px]">
        <form
          onSubmit={handleSubmit}
          className="flex-1 px-6 pt-10 sm:pt-12 pb-8 flex flex-col"
        >
          <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.05] text-[#241416] tracking-tight">
            Speaking
            <br />
            Practice
          </h1>

          <h2 className="mt-8 font-serif text-2xl text-[#241416]">
            Welcome Back
          </h2>
          <p className="mt-1 text-sm text-[#6B5F5C]">
            Sign in to continue your journey.
          </p>

          <MiniWaveform className="mt-5 text-[#8C2E3B]" />

          {/* Email */}
          <label className="mt-8 block">
            <span className="sr-only">Email Address</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <Mail className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="flex-1 bg-transparent text-sm text-[#241416] placeholder:text-[#9B8F86] outline-none"
              />
            </div>
          </label>

          {/* Password */}
          <label className="mt-3 block">
            <span className="sr-only">Password</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <Lock className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="flex-1 bg-transparent text-sm text-[#241416] placeholder:text-[#9B8F86] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 text-[#9B8F86] transition-colors hover:text-[#6B5F5C]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </label>

          {authError && (
            <p className="mt-3 text-sm text-[#8C2E3B]" role="alert">
              {authError}
            </p>
          )}

          {/* Sign In */}
          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={onSignIn}
            className="mt-4 text-center text-sm text-[#9B8F86] transition-colors hover:text-[#6B5F5C]"
          >
            Forgot Password?
          </button>

          <p className="mt-auto pt-10 text-center text-sm text-[#6B5F5C]">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onGoToSignUp}
              className="font-semibold text-[#7A2331] underline underline-offset-2 hover:text-[#6A1E2A]"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/** Decorative waveform bars, matching the mark used across the app. */
function MiniWaveform({ className = "" }) {
  const heights = [6, 12, 18, 10, 22, 14, 8, 16, 11, 20, 9, 13, 7, 17, 12, 6];
  return (
    <div className={`flex items-end gap-[3px] h-6 ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{ height: `${h}px`, backgroundColor: "currentColor" }}
        />
      ))}
    </div>
  );
}