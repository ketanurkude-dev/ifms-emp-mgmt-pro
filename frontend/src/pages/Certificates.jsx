import { useEffect, useState } from "react";
import { downloadFile, get, post } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";
import { StatusChip } from "./StatusChip";

const certTypes = ["Experience", "Service verification", "NOC", "Salary certificate", "Last pay certificate"];

const CERT_TYPE_KEYS = {
  Experience: "certType_experience",
  "Service verification": "certType_serviceVerification",
  NOC: "certType_noc",
  "Salary certificate": "certType_salaryCertificate",
  "Last pay certificate": "certType_lastPayCertificate",
};

const emptyForm = { certificate_type: certTypes[0], purpose: "" };

export default function Certificates() {
  const { t } = useLanguage();
  const [certificates, setCertificates] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    get("/certificates").then(setCertificates);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post("/certificates", form);
      setForm(emptyForm);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">{t("requestCertificate")}</h1>
          <p className="text-sm text-slate-500 mb-5">{t("requestCertificateSubtitle")}</p>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="certificate_type">
                {t("type")}
              </label>
              <select
                id="certificate_type"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.certificate_type}
                onChange={(e) => setForm({ ...form, certificate_type: e.target.value })}
              >
                {certTypes.map((ct) => (
                  <option key={ct} value={ct}>
                    {t(CERT_TYPE_KEYS[ct])}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="purpose">
                {t("purpose")}
              </label>
              <textarea
                id="purpose"
                rows={2}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
              >
                {submitting ? t("submitting") : t("submitRequest")}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">{t("myCertificates")}</h2>
          {!certificates ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
          ) : certificates.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noCertificatesYet")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="py-2 pr-4">{t("type")}</th>
                    <th className="py-2 pr-4">{t("purpose")}</th>
                    <th className="py-2 pr-4">{t("status")}</th>
                    <th className="py-2 pr-4">{t("certificateNo")}</th>
                    <th className="py-2 pr-4">{t("issuedOn")}</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4">{t(CERT_TYPE_KEYS[c.certificate_type]) || c.certificate_type}</td>
                      <td className="py-2 pr-4 text-slate-500">{c.purpose}</td>
                      <td className="py-2 pr-4">
                        <StatusChip status={c.status} />
                      </td>
                      <td className="py-2 pr-4">{c.certificate_number || "-"}</td>
                      <td className="py-2 pr-4">{c.issued_on || "-"}</td>
                      <td className="py-2">
                        {c.status === "Approved" && (
                          <button
                            onClick={() =>
                              downloadFile(`/certificates/${c.id}/pdf`, `certificate-${c.certificate_number}.pdf`)
                            }
                            className="text-sm text-teal-800 font-medium hover:text-teal-900"
                          >
                            {t("download")}
                          </button>
                        )}
                      </td>
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
