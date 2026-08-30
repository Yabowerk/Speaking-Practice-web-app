import React, { useState } from "react";
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SignUp({
  onCreateAccount = () => {},
  onGoToSignIn = () => {},
  termsUrl = "#",
  privacyUrl = "#",
  authError = "",
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    onCreateAccount({ fullName, email, password });
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[600px] sm:min-h-[640px]">
        <form
          onSubmit={handleSubmit}
          className="flex-1 px-6 pt-10 sm:pt-12 pb-8 flex flex-col"
        >
          <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.05] text-[#241416] tracking-tight">
            {t("Speaking Practice")}
          </h1>

          <h2 className="mt-8 font-serif text-2xl text-[#241416]">{t("Join us to start practicing.")}</h2>
          <p className="mt-1 text-sm text-[#6B5F5C]">
            {t("Create Account")}
          </p>

          {/* Full Name */}
          <label className="mt-6 block">
            <span className="sr-only">Full Name</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <User className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("Full Name")}
                className="flex-1 bg-transparent text-sm text-[#241416] placeholder:text-[#9B8F86] outline-none"
              />
            </div>
          </label>

          {/* Email */}
          <label className="mt-3 block">
            <span className="sr-only">Email Address</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <Mail className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Email Address")}
                className="flex-1 bg-transparent text-sm text-[#241416] placeholder:text-[#9B8F86] outline-none"
              />
            </div>
          </label>

          {/* Create Password */}
          <label className="mt-3 block">
            <span className="sr-only">Create Password</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <Lock className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Password")}
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

          {/* Confirm Password */}
          <label className="mt-3 block">
            <span className="sr-only">Confirm Password</span>
            <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-[#E7DDD0] px-4 py-3.5 focus-within:border-[#C9AAB0] transition-colors">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#9B8F86]" strokeWidth={1.75} />
              <input
                type={showConfirm ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("Password")}
                className="flex-1 bg-transparent text-sm text-[#241416] placeholder:text-[#9B8F86] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="shrink-0 text-[#9B8F86] transition-colors hover:text-[#6B5F5C]"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
          </label>

          {error && (
            <p className="mt-3 text-sm text-[#8C2E3B]" role="alert">
              {error}
            </p>
          )}

          {authError && (
            <p className="mt-3 text-sm text-[#8C2E3B]" role="alert">
              {authError}
            </p>
          )}

          {/* Create Account */}
          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#7A2331] py-3.5 text-sm font-semibold text-[#F6F1E7] shadow-sm transition-colors hover:bg-[#6A1E2A] active:scale-[0.98]"
          >
            {t("Create Account")}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-[#9B8F86]">
            By signing up, you agree to our{" "}
            <a
              href={termsUrl}
              className="font-medium text-[#7A2331] underline underline-offset-2 hover:text-[#6A1E2A]"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href={privacyUrl}
              className="font-medium text-[#7A2331] underline underline-offset-2 hover:text-[#6A1E2A]"
            >
              Privacy Policy
            </a>
            .
          </p>

          <p className="mt-auto pt-8 text-center text-sm text-[#6B5F5C]">
            {t("Already have an account?")}{" "}
            <button
              type="button"
              onClick={onGoToSignIn}
              className="font-semibold text-[#7A2331] underline underline-offset-2 hover:text-[#6A1E2A]"
            >
              {t("Sign In")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}