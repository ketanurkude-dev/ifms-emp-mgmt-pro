import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { downloadFile, get } from "../api/apiService";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import AppLayout from "./AppLayout";

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

export default function Gpf() {
  const employee = useCurrentEmployee();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState(null);

  function reportDiscrepancy(entry) {
    navigate("/grievances", {
      state: {
        category: "GPF",
        subject: `GPF discrepancy - ${monthFormatter.format(new Date(entry.month))}`,
        description: `Closing balance shown for ${monthFormatter.format(new Date(entry.month))} is Rs. ${entry.closing_balance}, which appears incorrect.`,
      },
    });
  }

  useEffect(() => {
    get("/gpf/ledger").then(setLedger);
  }, []);

  const closingBalance = ledger && ledger.length > 0 ? ledger[0].closing_balance : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-4">GPF account</h1>
          <dl className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Series</dt>
              <dd className="mt-0.5 text-slate-800">{employee?.gpf_series || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Account number</dt>
              <dd className="mt-0.5 text-slate-800">{employee?.gpf_account_number || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-slate-400">Closing balance</dt>
              <dd className="mt-0.5 text-slate-800 font-medium">
                {closingBalance !== null ? `Rs. ${closingBalance}` : "-"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-slate-400 mt-3">Subject to annual reconciliation.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-semibold text-slate-800">Ledger</h2>
            {ledger && ledger.length > 0 && (
              <button
                onClick={() => downloadFile("/gpf/annual-statement/pdf", "gpf-annual-statement.pdf")}
                className="text-xs font-medium text-teal-800 border border-teal-700 rounded px-2.5 py-1 hover:bg-teal-50 shrink-0"
              >
                Download annual statement
              </button>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-5">Last 12 months</p>

          {!ledger ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="py-2 pr-4">Month</th>
                    <th className="py-2 pr-4 text-right">Subscription</th>
                    <th className="py-2 pr-4 text-right">Advance</th>
                    <th className="py-2 pr-4 text-right">Withdrawal</th>
                    <th className="py-2 pr-4 text-right">Interest</th>
                    <th className="py-2 pr-4 text-right">Closing balance</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((entry) => (
                    <tr key={entry.month} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 font-medium text-slate-800">
                        {monthFormatter.format(new Date(entry.month))}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums">Rs. {entry.subscription}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{entry.advance ? `Rs. ${entry.advance}` : "-"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">{entry.withdrawal ? `Rs. ${entry.withdrawal}` : "-"}</td>
                      <td className="py-2 pr-4 text-right tabular-nums">Rs. {entry.interest}</td>
                      <td className="py-2 pr-4 text-right tabular-nums font-medium">Rs. {entry.closing_balance}</td>
                      <td className="py-2">
                        <button
                          onClick={() => reportDiscrepancy(entry)}
                          className="text-xs text-red-700 font-medium hover:text-red-800 whitespace-nowrap"
                        >
                          Report discrepancy
                        </button>
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
