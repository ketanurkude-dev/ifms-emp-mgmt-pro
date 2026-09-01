import { useLanguage } from "../i18n/LanguageContext";

// Shared two-column layout for the login, OTP and register screens:
// a branded left panel, and the form on the right.
export default function AuthLayout({ title, subtitle, children }) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-teal-900 p-12 text-white border-r border-teal-950">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-orange-600" />

        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded bg-white/10 border border-white/20 flex items-center justify-center text-sm font-semibold">
              EP
            </div>
            <span className="text-base font-semibold tracking-wide">{t("appName")}</span>
          </div>
          <p className="text-teal-100/70 text-sm ml-[48px]">{t("tagline")}</p>
        </div>

        <div className="max-w-sm">
          <h2 className="text-2xl font-semibold leading-snug mb-4">
            One account for your service, salary and requests
          </h2>
          <p className="text-teal-100/80 text-sm leading-relaxed">
            View salary slips, track your GPF balance, raise requests and
            follow their approval status — all from a single secure account.
          </p>
        </div>

        <p className="text-xs text-teal-100/50">
          &copy; {new Date().getFullYear()} {t("appName")}. For authorised use only.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-sm font-semibold">
                EP
              </div>
              <span className="font-semibold text-slate-800">{t("appName")}</span>
            </div>
            <button
              onClick={toggleLanguage}
              className="text-sm text-teal-800 border border-slate-300 px-3 py-1 rounded hover:bg-slate-50 ml-auto"
            >
              {language === "en" ? "हिन्दी" : "English"}
            </button>
          </div>

          <h1 className="text-2xl font-semibold text-slate-800 mb-1">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mb-8">{subtitle}</p>}

          {children}
        </div>
      </div>
    </div>
  );
}
