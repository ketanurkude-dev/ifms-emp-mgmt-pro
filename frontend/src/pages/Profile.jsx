import { useEffect, useState } from "react";
import { get, post, put } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";
import { StatusChip } from "./StatusChip";

export default function Profile() {
  const { t } = useLanguage();
  const readOnlyFields = [
    ["name", t("fullName")],
    ["designation", t("designation")],
    ["office", t("office")],
    ["ddo_code", t("ddoCode")],
    ["basic_pay", t("basicPay")],
  ];
  const [employee, setEmployee] = useState(null);
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const [changeRequests, setChangeRequests] = useState([]);
  const [openField, setOpenField] = useState(null); // which read-only field has its request form open
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function loadProfile() {
    get("/profile/me").then((data) => {
      setEmployee(data);
      setEmail(data.email || "");
      setMobile(data.mobile);
    });
  }

  function loadChangeRequests() {
    get("/profile/change-requests").then(setChangeRequests);
  }

  useEffect(() => {
    loadProfile();
    loadChangeRequests();
  }, []);

  async function handleSaveContact(e) {
    e.preventDefault();
    setSavingContact(true);
    setContactMessage("");
    try {
      await put("/profile/me", { email, mobile });
      setContactMessage(t("contactUpdated"));
      loadProfile();
    } catch {
      setContactMessage(t("contactUpdateFailed"));
    } finally {
      setSavingContact(false);
    }
  }

  function openRequestForm(fieldKey, currentValue) {
    setOpenField(fieldKey);
    setNewValue("");
    setReason("");
  }

  async function handleSubmitRequest(e, fieldLabel, currentValue) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post("/profile/change-requests", {
        request_type: "profile_change",
        title: `Change ${fieldLabel}`,
        description: `From "${currentValue}" to "${newValue}". Reason: ${reason}`,
      });
      setOpenField(null);
      loadChangeRequests();
    } finally {
      setSubmitting(false);
    }
  }

  if (!employee) {
    return (
      <AppLayout>
        <p className="text-slate-500 text-sm">{t("loading")}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Editable contact details */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-1">{t("contactDetails")}</h2>
          <p className="text-sm text-slate-500 mb-5">{t("contactDetailsSubtitle")}</p>

          <form onSubmit={handleSaveContact} className="grid sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="mobile">
                {t("mobile")}
              </label>
              <input
                id="mobile"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={savingContact}
                className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
              >
                {savingContact ? t("saving") : t("save")}
              </button>
              {contactMessage && <span className="text-sm text-slate-500">{contactMessage}</span>}
            </div>
          </form>
        </div>

        {/* Read-only, request-to-change fields */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-1">{t("serviceParticulars")}</h2>
          <p className="text-sm text-slate-500 mb-5">{t("serviceParticularsSubtitle")}</p>

          <div className="divide-y divide-slate-200">
            {readOnlyFields.map(([key, label]) => {
              const value = key === "basic_pay" ? `Rs. ${employee[key]}` : employee[key];
              return (
                <div key={key} className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="text-sm text-slate-800 mt-0.5">{value}</p>
                    </div>
                    <button
                      onClick={() => openRequestForm(key, value)}
                      className="text-sm text-teal-800 font-medium hover:text-teal-900"
                    >
                      {t("requestChange")}
                    </button>
                  </div>

                  {openField === key && (
                    <form
                      onSubmit={(e) => handleSubmitRequest(e, label, value)}
                      className="mt-4 bg-slate-50 border border-slate-200 rounded p-4 space-y-3"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("newValue")}</label>
                        <input
                          className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{t("reason")}</label>
                        <input
                          className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="bg-teal-800 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
                        >
                          {t("submitRequest")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenField(null)}
                          className="border border-slate-300 px-3 py-1.5 rounded text-sm text-slate-600 hover:bg-slate-100"
                        >
                          {t("cancel")}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Change request history */}
        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t("changeRequestHistory")}</h2>
          {changeRequests.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noChangeRequests")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="py-2 pr-4">{t("title")}</th>
                    <th className="py-2 pr-4">{t("details")}</th>
                    <th className="py-2 pr-4">{t("status")}</th>
                    <th className="py-2">{t("raisedOn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {changeRequests.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4">{r.title}</td>
                      <td className="py-2 pr-4 text-slate-500">{r.description}</td>
                      <td className="py-2 pr-4">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="py-2 text-slate-500">{r.server_date.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
