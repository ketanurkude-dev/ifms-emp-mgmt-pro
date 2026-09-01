import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import { useLanguage } from "../i18n/LanguageContext";
import {
  ApproverIcon,
  CertificateIcon,
  CircularsIcon,
  DashboardIcon,
  FaqIcon,
  GpfIcon,
  GrievanceIcon,
  PensionIcon,
  ProfileIcon,
  RequestsIcon,
  SalaryIcon,
  TaxIcon,
} from "./Icons";

// Shared header + left sidebar nav for every page after login.
export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const employee = useCurrentEmployee();
  const { t, language, toggleLanguage } = useLanguage();
  const isApprover = employee && (employee.role === "ddo" || employee.role === "hod");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const navItems = [
    { to: "/dashboard", label: t("navDashboard"), Icon: DashboardIcon },
    { to: "/profile", label: t("navProfile"), Icon: ProfileIcon },
    { to: "/salary", label: t("navSalary"), Icon: SalaryIcon },
    { to: "/gpf", label: t("navGpf"), Icon: GpfIcon },
    { to: "/requests", label: t("navRequests"), Icon: RequestsIcon },
    { to: "/certificates", label: t("navCertificates"), Icon: CertificateIcon },
    { to: "/tax", label: t("navTax"), Icon: TaxIcon },
    { to: "/pension", label: t("navPension"), Icon: PensionIcon },
    { to: "/grievances", label: t("navGrievance"), Icon: GrievanceIcon },
    { to: "/circulars", label: t("navCirculars"), Icon: CircularsIcon },
    { to: "/faq", label: t("navFaq"), Icon: FaqIcon },
  ];

  function handleLogout() {
    localStorage.removeItem("access_token");
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md ${
      isActive ? "bg-teal-800 text-white" : "text-slate-600 hover:bg-slate-100"
    }`;

  const approverLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md ${
      isActive ? "bg-orange-600 text-white" : "text-orange-700 hover:bg-orange-50"
    }`;

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="bg-teal-900 text-white shrink-0">
        <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="mr-1 p-1.5 rounded hover:bg-white/10"
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              <div className="w-5 h-0.5 bg-white mb-1" />
              <div className="w-5 h-0.5 bg-white mb-1" />
              <div className="w-5 h-0.5 bg-white" />
            </button>
            <div className="w-7 h-7 rounded bg-white/10 border border-white/20 flex items-center justify-center text-xs font-semibold">
              EP
            </div>
            <span className="font-semibold text-sm">{t("appName")}</span>
            {employee && (
              <span className="text-xs text-teal-100/70 border border-white/20 rounded px-2 py-0.5 ml-2">
                {employee.role}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="text-sm border border-white/30 hover:bg-white/10 px-3 py-1.5 rounded"
            >
              {language === "en" ? "हिन्दी" : "English"}
            </button>
            <button
              onClick={handleLogout}
              className="text-sm border border-white/30 hover:bg-white/10 px-3 py-1.5 rounded"
            >
              {t("logout")}
            </button>
          </div>
        </div>
        <div className="h-1 bg-orange-600" />
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarVisible && (
          <aside className="w-56 shrink-0 bg-white border-r border-slate-200 h-full overflow-y-auto p-3">
            <nav className="space-y-1">
              {navItems.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
                  {label}
                </NavLink>
              ))}
              {isApprover && (
                <NavLink to="/approver" className={approverLinkClass}>
                  <ApproverIcon style={{ width: 18, height: 18 }} className="shrink-0" />
                  {t("navApprover")}
                </NavLink>
              )}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 h-full overflow-y-auto px-4 sm:px-6 py-6">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
