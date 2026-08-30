import { createContext, useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { useTranslation } from "react-i18next";

export const AppContext = createContext();

export function AppProvider({ children }) {
    const [user, setUser] = useState(null);
    const [serverdata, setServerdata] = useState({});

    function LoadingState() {
        const { t } = useTranslation();
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 rounded-2xl bg-white/70 border border-[#E7DDD0] py-16 px-6 text-center">
                <span className="h-9 w-9 rounded-full border-[3px] border-[#E7DDD0] border-t-[#7A2331] animate-spin" />
                <p className="text-sm text-[#6B5F5C] leading-relaxed">
                    {t("Transcribing your session.")}
                    <br />
                    {t("This can take up to 30 seconds.")}
                </p>
            </div>
        );
    }
    //play pause 


    return (
        <AppContext.Provider value={{ user, setUser, LoadingState, serverdata, setServerdata }}>
            {children}
        </AppContext.Provider>
    );
}