import { useEffect, useState } from "react";
import { get, post } from "../api/apiService";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import AppLayout from "./AppLayout";

const emptyForm = { title: "", category: "General", issuing_office: "", content: "", requires_ack: false };

export default function Circulars() {
  const employee = useCurrentEmployee();
  const isApprover = employee && (employee.role === "ddo" || employee.role === "hod");
  const [circulars, setCirculars] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    get("/circulars").then(setCirculars);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAcknowledge(id) {
    await post(`/circulars/${id}/acknowledge`);
    load();
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await post("/circulars", form);
      setForm(emptyForm);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {isApprover && (
          <div className="bg-white border border-slate-200 rounded p-6">
            <h1 className="font-semibold text-slate-800 mb-1">Publish a circular</h1>
            <form onSubmit={handleCreate} className="grid sm:grid-cols-2 gap-4 max-w-2xl mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Issuing office</label>
                <input
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  value={form.issuing_office}
                  onChange={(e) => setForm({ ...form, issuing_office: e.target.value })}
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Content</label>
                <textarea
                  rows={3}
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.requires_ack}
                  onChange={(e) => setForm({ ...form, requires_ack: e.target.checked })}
                />
                Requires acknowledgement
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Circulars</h2>
          {!circulars ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : circulars.length === 0 ? (
            <p className="text-sm text-slate-500">No circulars yet.</p>
          ) : (
            <div className="space-y-4">
              {circulars.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                        {c.category} &middot; {c.issuing_office} &middot; {c.published_on}
                      </p>
                      <h3 className="font-medium text-slate-800">{c.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{c.content}</p>
                    </div>
                    {c.requires_ack && (
                      <button
                        onClick={() => handleAcknowledge(c.id)}
                        disabled={c.acknowledged}
                        className={`text-sm font-medium px-3 py-1.5 rounded border shrink-0 ${
                          c.acknowledged
                            ? "border-slate-200 text-slate-400"
                            : "border-teal-700 text-teal-800 hover:bg-teal-50"
                        }`}
                      >
                        {c.acknowledged ? "Acknowledged" : "Acknowledge"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
