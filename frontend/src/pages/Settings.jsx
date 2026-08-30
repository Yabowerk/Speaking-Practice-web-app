import React, { useState } from "react";
import { ChevronLeft, Globe, LogOut, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import supabase from "../lib/supabase";

const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "am", label: "Amharic", nativeLabel: "አማርኛ" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLanguageSelect = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("app_language", code);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F6F1E7] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-sm sm:max-w-md flex flex-col rounded-[2rem] bg-[#F6F1E7] sm:shadow-xl sm:ring-1 sm:ring-black/5 overflow-hidden min-h-[520px]">

        {/* Top bar */}
        <div className="flex items-center px-5 pt-6 pb-2">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#241416] transition-colors hover:bg-black/5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 pb-6">
          <h1 className="font-serif text-3xl text-[#241416]">
            {t("Settings")}
          </h1>
        </div>

        {/* Body */}
        <div className="flex-1 px-5 pb-8 flex flex-col gap-3">

          {/* Language section */}
          <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] shadow-sm overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-[#E7DDD0]">
              <Globe className="h-4 w-4 text-[#9B8F86]" strokeWidth={1.75} />
              <span className="text-[11px] font-semibold tracking-[0.14em] text-[#9B8F86] uppercase">
                {t("Language")}
              </span>
            </div>

            {/* Language options */}
            <div className="divide-y divide-[#E7DDD0]">
              {LANGUAGES.map((lang) => {
                const isActive = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${isActive ? "bg-[#FBEDEE]" : "hover:bg-black/[0.02]"}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-medium ${isActive ? "text-[#7A2331]" : "text-[#241416]"}`}>
                        {t(lang.label)}
                      </span>
                      <span className="text-xs text-[#9B8F86]">
                        {lang.nativeLabel}
                      </span>
                    </div>

                    {isActive && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7A2331]">
                        <Check className="h-3 w-3 text-[#F6F1E7]" strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Log out */}
          <div className="rounded-2xl bg-white/70 border border-[#E7DDD0] shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[#FFF0F0] disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FBEDEE] text-[#8C2E3B] shrink-0">
                <LogOut className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-[#8C2E3B]">
                {loggingOut ? "Signing out…" : t("Log out")}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
