import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    get("/dashboard/me")
      .then((data) => setEmployee(data))
      .catch(() => {
        setError(t("sessionExpired"));
        localStorage.removeItem("access_token");
        setTimeout(() => navigate("/login"), 1500);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">{error}</div>;
  }

  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">{t("loading")}</div>;
  }

  const fields = [
    [t("employeeCode"), employee.employee_code],
    [t("designation"), employee.designation],
    [t("office"), employee.office],
    [t("ddoCode"), employee.ddo_code],
    [t("mobile"), employee.mobile],
    [t("email"), employee.email || "-"],
    [t("dateOfJoining"), employee.date_of_joining],
    [t("dateOfSuperannuation"), employee.date_of_superannuation],
    [t("basicPay"), `Rs. ${employee.basic_pay}`],
  ];

  return (
    <AppLayout>
      <div className="bg-white border border-slate-200 rounded p-6">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">{employee.name}</h1>
        <p className="text-sm text-slate-500 mb-6">{t("dashboardWelcome")}</p>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
              <dd className="text-sm text-slate-800 mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </AppLayout>
  );
}
