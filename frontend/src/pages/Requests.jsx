import { useEffect, useState } from "react";
import { get, post } from "../api/apiService";
import AppLayout from "./AppLayout";
import { StatusChip } from "./StatusChip";

const requestTypes = [
  "GPF advance",
  "House building advance",
  "Vehicle advance",
  "Computer advance",
  "Festival advance",
  "Medical reimbursement",
  "Leave encashment",
  "Certificate",
  "Other",
];

const emptyForm = { request_type: requestTypes[0], title: "", description: "", amount: "" };

export default function Requests() {
  const [requests, setRequests] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function loadRequests() {
    get("/requests").then(setRequests);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await post("/requests", {
        ...form,
        amount: form.amount ? Number(form.amount) : null,
      });
      setForm(emptyForm);
      loadRequests();
    } catch (err) {
      setError(err.response?.data?.detail || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(id) {
    await post(`/requests/${id}/withdraw`);
    loadRequests();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">Raise a new request</h1>
          <p className="text-sm text-slate-500 mb-5">
            Choose a type and fill in the details. It will be sent for approval.
          </p>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2 max-w-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="request_type">
                Type
              </label>
              <select
                id="request_type"
                name="request_type"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.request_type}
                onChange={handleChange}
              >
                {requestTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="amount">
                Amount (if applicable)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.amount}
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                name="title"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                value={form.description}
                onChange={handleChange}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-teal-800 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit request"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-4">My requests</h2>

          {!requests ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4 text-right">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Raised on</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="py-2 pr-4">{r.request_type}</td>
                      <td className="py-2 pr-4">{r.title}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{r.amount ? `Rs. ${r.amount}` : "-"}</td>
                      <td className="py-2 pr-4">
                        <StatusChip status={r.status} />
                        {r.review_remarks && (
                          <p className="text-xs text-slate-500 mt-1 max-w-xs">{r.review_remarks}</p>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-500">{r.server_date.slice(0, 10)}</td>
                      <td className="py-2">
                        {r.status === "Submitted" && (
                          <button
                            onClick={() => handleWithdraw(r.id)}
                            className="text-sm text-red-700 font-medium hover:text-red-800"
                          >
                            Withdraw
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
