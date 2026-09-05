import { useEffect, useState } from "react";
import { get, post } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";

export default function Approver() {
  const { t } = useLanguage();
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
      alert(t("remarksRequiredAlert"));
      return;
    }
    await post(`/approver/${kind}/${id}/review`, { status: decision, review_remarks });
    load();
  }

  async function handleGrievanceReply(id) {
    const reply = replyById[id] || "";
    if (!reply) {
      alert(t("pleaseEnterReply"));
      return;
    }
    await post(`/grievances/${id}/reply`, { reply, status: "Closed" });
    load();
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">{t("approverWorkbench")}</h1>
          <p className="text-sm text-slate-500 mb-5">{t("approverWorkbenchSubtitle")}</p>

          {!queue ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
          ) : queue.length === 0 ? (
            <p className="text-sm text-slate-500">{t("nothingPending")}</p>
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
                        <p className="text-xs text-slate-400 mt-1">{t("raisedOn")} {item.server_date.slice(0, 10)}</p>
                      </div>
                    </div>

                    <input
                      placeholder={t("remarksRequiredToReturn")}
                      className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      value={remarksById[key] || ""}
                      onChange={(e) => setRemarksById({ ...remarksById, [key]: e.target.value })}
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Approved")}
                        className="text-sm font-medium bg-green-700 text-white px-3 py-1.5 rounded hover:bg-green-800"
                      >
                        {t("approve")}
                      </button>
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Returned")}
                        className="text-sm font-medium border border-orange-300 text-orange-700 px-3 py-1.5 rounded hover:bg-orange-50"
                      >
                        {t("returnForClarification")}
                      </button>
                      <button
                        onClick={() => handleReview(item.kind, item.id, "Rejected")}
                        className="text-sm font-medium border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-50"
                      >
                        {t("reject")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <h2 className="font-semibold text-slate-800 mb-1">{t("grievanceQueueTitle")}</h2>
          <p className="text-sm text-slate-500 mb-5">{t("grievanceQueueSubtitle")}</p>

          {!grievanceQueue ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
          ) : grievanceQueue.length === 0 ? (
            <p className="text-sm text-slate-500">{t("noGrievancesPending")}</p>
          ) : (
            <div className="space-y-4">
              {grievanceQueue.map((g) => (
                <div key={g.id} className="border border-slate-200 rounded p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{g.category}</p>
                  <h3 className="font-medium text-slate-800">{g.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t("raisedOn")} {g.server_date.slice(0, 10)}</p>
                  <p className="text-sm text-slate-600 mt-1">{g.description}</p>

                  <textarea
                    placeholder={t("replyPlaceholder")}
                    rows={2}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm mt-3 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    value={replyById[g.id] || ""}
                    onChange={(e) => setReplyById({ ...replyById, [g.id]: e.target.value })}
                  />
                  <button
                    onClick={() => handleGrievanceReply(g.id)}
                    className="text-sm font-medium bg-teal-800 text-white px-3 py-1.5 rounded hover:bg-teal-900"
                  >
                    {t("replyAndClose")}
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
