import { useEffect, useState } from "react";
import { downloadFile, get, post } from "../api/apiService";
import AppLayout from "./AppLayout";

const sections = ["80C", "80CCD(1B)", "80D", "80E", "80G", "80TTA", "24(b)"];
const currentFinancialYear = "2026-27";

const emptyForm = { section: sections[0], instrument: "", declared_amount: "" };

export default function Tax() {
  const [lines, setLines] = useState(null);
  const [documents, setDocuments] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    get(`/tax/declarations?financial_year=${currentFinancialYear}`).then(setLines);
    get("/tax/documents").then(setDocuments);
  }

  useEffect(() => {
    load();
  }, []);

  const total = lines ? lines.reduce((sum, l) => sum + l.declared_amount, 0) : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await post("/tax/declarations", {
        ...form,
        financial_year: currentFinancialYear,
        declared_amount: Number(form.declared_amount),
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not save declaration");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">Tax declaration — FY {currentFinancialYear}</h1>
          <p className="text-sm text-slate-500 mb-5">Declare your investments section-wise.</p>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4 max-w-2xl mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
              <select
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              >
                {sections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Instrument</label>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.instrument}
                onChange={(e) => setForm({ ...form, instrument: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount</label>
              <input
                type="number"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.declared_amount}
                onChange={(e) => setForm({ ...form, declared_amount: e.target.value })}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
              >
                {submitting ? "Adding..." : "Add declaration"}
              </button>
            </div>
          </form>

          {!lines ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : lines.length === 0 ? (
            <p className="text-sm text-slate-500">No declarations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="py-2 pr-4">Section</th>
                    <th className="py-2 pr-4">Instrument</th>
                    <th className="py-2 pr-4 text-right">Declared amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4">{l.section}</td>
                      <td className="py-2 pr-4">{l.instrument}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">Rs. {l.declared_amount}</td>
                      <td className="py-2">{l.status}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="py-2 pr-4 font-medium text-slate-800">Total declared</td>
                    <td className="py-2 pr-4 text-right tabular-nums font-medium text-slate-800">Rs. {total}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Tax documents</h2>
          {!documents ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-sm text-slate-500">No tax documents issued yet.</p>
          ) : (
            <ul className="text-sm divide-y divide-slate-100">
              {documents.map((d) => (
                <li key={d.id} className="py-2 flex items-center justify-between">
                  <span>{d.doc_type} — FY {d.financial_year}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500">{d.issued_on || "Not yet issued"}</span>
                    {d.issued_on && (
                      <button
                        onClick={() =>
                          downloadFile(`/tax/documents/${d.id}/pdf`, `${d.doc_type}-${d.financial_year}.pdf`)
                        }
                        className="text-teal-800 font-medium hover:text-teal-900"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-400 mt-3">
            Form 16 for FY {currentFinancialYear} is not yet issued — expected after year-end.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
