import { useEffect, useState } from "react";
import { get, post } from "../api/apiService";
import AppLayout from "./AppLayout";

export default function Approver() {
  const [queue, setQueue] = useState(null);
  const [grievanceQueue, setGrievanceQueue] = useState(null);
  const [remarksById, setRemarksById] = useState({});
  const [replyById, setReplyById] = useState({});

  function load() {
    get("/approver/queue").then(setQueue);
    get("/grievances/queue").then(setGrievanceQueue);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReview(kind, id, decision) {
    const review_remarks = remarksById[`${kind}-${id}`] || "";
    if (decision === "Returned" && !review_remarks) {
      alert("Remarks are required to return an item.");
      return;
    }
    await post(`/approver/${kind}/${id}/review`, { status: decision, review_remarks });
    load();
  }

  async function handleGrievanceReply(id) {
    const reply = replyById[id] || "";
    if (!reply) {
      alert("Please enter a reply.");
      return;
    }
    await post(`/grievances/${id}/reply`, { reply, status: "Closed" });
    load();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">Approver workbench</h1>
          <p className="text-sm text-slate-500 mb-5">Requests and certificates awaiting your decision.</p>

          {!queue ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : queue.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing pending. Queue is clear.</p>
          ) : (
            <div className="space-y-4">
              {queue.map((item) => {
                const key = `${item.kind}-${item.id}`;
                return (
                  <div key={key} className="border border-slate-200 rounded p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                          {item.kind} &middot; {item.employee_name}
                        </p>
                        <h3 className="font-medium text-slate-800">{item.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Raised {item.server_date.slice(0, 10)}</p>
                      </div>
                    </div>

                    <input
                      placeholder="Remarks (required to return)"
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      value={remarksById[key] || ""}
                      onChange={(e) => setRemarksById({ ...remarksById, [key]: e.target.value })}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Approved")}
                        className="text-sm font-medium bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Returned")}
                        className="text-sm font-medium border border-orange-300 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-50"
                      >
                        Return for clarification
                      </button>
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Rejected")}
                        className="text-sm font-medium border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Grievance queue</h2>
          <p className="text-sm text-slate-500 mb-5">Reply to close a grievance.</p>

          {!grievanceQueue ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : grievanceQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No grievances pending.</p>
          ) : (
            <div className="space-y-4">
              {grievanceQueue.map((g) => (
                <div key={g.id} className="border border-slate-200 rounded p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{g.category}</p>
                  <h3 className="font-medium text-slate-800">{g.subject}</h3>
                  <p className="text-sm text-slate-600 mt-1">{g.description}</p>

                  <textarea
                    placeholder="Reply..."
                    rows={2}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm mt-3 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    value={replyById[g.id] || ""}
                    onChange={(e) => setReplyById({ ...replyById, [g.id]: e.target.value })}
                  />
                  <button
                    onClick={() => handleGrievanceReply(g.id)}
                    className="text-sm font-medium bg-teal-800 text-white px-3 py-1.5 rounded hover:bg-teal-900"
                  >
                    Reply & close
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
