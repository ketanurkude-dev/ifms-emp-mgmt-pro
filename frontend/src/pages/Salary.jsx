import { useEffect, useState } from "react";
import { downloadFile, get } from "../api/apiService";
import AppLayout from "./AppLayout";

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

function formatMonth(dateStr) {
  return monthFormatter.format(new Date(dateStr));
}

export default function Salary() {
  const [slips, setSlips] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    get("/salary/slips").then((data) => {
      setSlips(data);
      setSelected(data.find((s) => s.published_on) || null);
    });
  }, []);

  if (!slips) {
    return (
      <AppLayout>
        <p className="text-slate-500 text-sm">Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">Salary slips</h1>
          <p className="text-sm text-slate-500 mb-5">Last 12 months. Click a month to see the breakup.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2 pr-4 text-right">Gross</th>
                  <th className="py-2 pr-4 text-right">Deductions</th>
                  <th className="py-2 pr-4 text-right">Net</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip) => (
                  <tr
                    key={slip.month}
                    onClick={() => slip.published_on && setSelected(slip)}
                    className={`border-b border-slate-100 last:border-0 ${
                      slip.published_on ? "cursor-pointer hover:bg-slate-50" : ""
                    } ${selected?.month === slip.month ? "bg-teal-50" : ""}`}
                  >
                    <td className="py-3 pr-4 font-medium text-slate-800">{formatMonth(slip.month)}</td>
                    {slip.published_on ? (
                      <>
                        <td className="py-3 pr-4 text-right tabular-nums">Rs. {slip.gross}</td>
                        <td className="py-3 pr-4 text-right tabular-nums">Rs. {slip.deductions}</td>
                        <td className="py-3 pr-4 text-right tabular-nums font-medium">Rs. {slip.net}</td>
                        <td className="py-3 text-slate-500">Published {slip.published_on}</td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-3 text-slate-500 italic">
                        Will be published after bill passing.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-semibold text-slate-800">
              {selected ? formatMonth(selected.month) : "Component break-up"}
            </h2>
            {selected && (
              <button
                onClick={() =>
                  downloadFile(`/salary/slips/${selected.id}/pdf`, `salary-slip-${selected.month}.pdf`)
                }
                className="text-xs font-medium text-teal-800 border border-teal-700 rounded px-2.5 py-1 hover:bg-teal-50 shrink-0"
              >
                Download PDF
              </button>
            )}
          </div>
          {!selected ? (
            <p className="text-sm text-slate-500">Select a published month to see the break-up.</p>
          ) : (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400 mt-4 mb-2">Earnings</p>
              <Row label="Basic pay" value={selected.basic_pay} />
              <Row label="Dearness allowance" value={selected.dearness_allowance} />
              <Row label="House rent allowance" value={selected.house_rent_allowance} />
              <Row label="Transport allowance" value={selected.transport_allowance} />
              <Row label="Gross" value={selected.gross} bold />

              <p className="text-xs uppercase tracking-wide text-slate-400 mt-5 mb-2">Deductions</p>
              <Row label="GPF subscription" value={selected.gpf_subscription} />
              <Row label="Income tax" value={selected.income_tax} />
              <Row label="Professional tax" value={selected.professional_tax} />
              <Row label="Total deductions" value={selected.deductions} bold />

              <div className="border-t border-slate-200 mt-4 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Net pay</span>
                <span className="font-semibold text-slate-800 tabular-nums">Rs. {selected.net}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={bold ? "font-medium text-slate-800" : "text-slate-600"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-medium text-slate-800" : "text-slate-600"}`}>Rs. {value}</span>
    </div>
  );
}
