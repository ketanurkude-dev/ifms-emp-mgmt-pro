import { useEffect, useState } from "react";
import { get } from "../api/apiService";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";

const APPROVER_REPORTS = [
  { key: "requests-pipeline", label: "navRequests" },
  { key: "certificates-pipeline", label: "navCertificates" },
  { key: "grievances-pipeline", label: "navGrievance" },
];

function CountsTable({ data }) {
  const entries = Object.entries(data || {});
  if (entries.length === 0) return <p className="text-slate-400 text-sm">No data</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left uppercase tracking-wide text-slate-400 border-b border-slate-200">
          <th className="py-2">Status</th>
          <th className="py-2">Count</th>
        </tr>
      </thead>
      <tbody>
        {entries.map(([status, count]) => (
          <tr key={status} className="border-b border-slate-100">
            <td className="py-2">{status}</td>
            <td className="py-2">{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Reports() {
  const { t } = useLanguage();
  const employee = useCurrentEmployee();
  const isApprover = employee && (employee.role === "ddo" || employee.role === "hod");
  const [activeKey, setActiveKey] = useState(null);
  const [data, setData] = useState(null);
  const [mySummary, setMySummary] = useState(null);

  useEffect(() => {
    get("/reports/my-summary").then(setMySummary);
  }, []);

  useEffect(() => {
    if (activeKey) {
      get(`/reports/${activeKey}`).then(setData);
    }
  }, [activeKey]);

  if (!employee) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">{t("loading")}</div>;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-4">{t("navReports")} — {t("navProfile")}</h1>
          {!mySummary ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(mySummary).map(([section, counts]) => (
                <div key={section} className="border border-slate-200 rounded p-3">
                  <h3 className="text-xs uppercase tracking-wide text-slate-400 mb-2">{section}</h3>
                  <CountsTable data={counts} />
                </div>
              ))}
            </div>
          )}
        </div>

        {isApprover && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded p-4 lg:col-span-1 h-fit">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">{t("navReports")}</h2>
              <div className="space-y-1">
                {APPROVER_REPORTS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setActiveKey(r.key)}
                    className={`w-full text-left text-sm px-3 py-2 rounded ${activeKey === r.key ? "bg-teal-800 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    {t(r.label)}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded p-4 lg:col-span-3">
              {!activeKey && <p className="text-slate-400 text-center py-6">{t("selectAReport")}</p>}
              {activeKey && !data && <p className="text-slate-400 text-center py-6">{t("loading")}</p>}
              {activeKey && data && <CountsTable data={data} />}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
