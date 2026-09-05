import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { get, post } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";
import ApplicationDateField from "./ApplicationDateField";
import { StatusChip } from "./StatusChip";

const categories = ["Salary", "Allowance", "Deduction", "GPF", "Loan", "Income tax", "Service matter", "Certificate", "Pension", "Portal", "Other"];

const CATEGORY_KEYS = {
  Salary: "grCat_salary",
  Allowance: "grCat_allowance",
  Deduction: "grCat_deduction",
  GPF: "grCat_gpf",
  Loan: "grCat_loan",
  "Income tax": "grCat_incomeTax",
  "Service matter": "grCat_serviceMatter",
  Certificate: "grCat_certificate",
  Pension: "grCat_pension",
  Portal: "grCat_portal",
  Other: "grCat_other",
};

const emptyForm = { category: categories[0], subject: "", description: "" };

export default function Grievances() {
  const { t } = useLanguage();
  const location = useLocation();
  // Some pages (e.g. GPF "Report discrepancy") link here with a pre-filled
  // draft via router state, so the user doesn't retype what's already known.
  const [grievances, setGrievances] = useState(null);
  const [form, setForm] = useState({ ...emptyForm, ...location.state });
  const [submitting, setSubmitting] = useState(false);

  function load() {
    get("/grievances").then(setGrievances);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post("/grievances", form);
      setForm(emptyForm);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRate(id, rating) {
    await post(`/grievances/${id}/rate`, { rating });
    load();
  }

  async function handleReopen(id) {
    await post(`/grievances/${id}/reopen`);
    load();
  }

  const reopenDisabled = (g) => {
    if (!g.closed_at) return true;
    const days = (Date.now() - new Date(g.closed_at).getTime()) / (1000 * 60 * 60 * 24);
    return days > 30;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">{t("lodgeGrievance")}</h1>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 max-w-2xl mt-4">
            <ApplicationDateField />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("category")}</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {t(CATEGORY_KEYS[c]) || c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("subject")}</label>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("description")}</label>
              <textarea
                rows={3}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
              >
                {submitting ? t("submitting") : t("submitGrievance")}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t("myGrievances")}</h2>
          {!grievances ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
          ) : grievances.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noGrievancesYet")}</p>
          ) : (
            <div className="space-y-4">
              {grievances.map((g) => (
                <div key={g.id} className="border border-slate-200 rounded p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{t(CATEGORY_KEYS[g.category]) || g.category}</p>
                      <h3 className="font-medium text-slate-800">{g.subject}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{t("raisedOn")}: {g.server_date?.slice(0, 10)}</p>
                      <p className="text-sm text-slate-600 mt-1">{g.description}</p>
                      {g.reply && (
                        <div className="mt-3 bg-slate-50 border border-slate-200 rounded p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{t("reply")}</p>
                          <p className="text-sm text-slate-700">{g.reply}</p>
                        </div>
                      )}
                    </div>
                    <StatusChip status={g.status} />
                  </div>

                  {g.status === "Closed" && (
                    <div className="mt-3 flex items-center gap-4">
                      {g.rating ? (
                        <span className="text-sm text-slate-500">{t("ratedOutOf5").replace("{n}", g.rating)}</span>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          {t("rate")}
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              onClick={() => handleRate(g.id, n)}
                              className="text-amber-500 hover:text-amber-600"
                            >
                              &#9733;
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleReopen(g.id)}
                        disabled={reopenDisabled(g)}
                        title={reopenDisabled(g) ? t("reopenWindowPassed") : ""}
                        className={`text-sm font-medium ${
                          reopenDisabled(g) ? "text-slate-300 cursor-not-allowed" : "text-teal-800 hover:text-teal-900"
                        }`}
                      >
                        {t("reopenWithin30")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
