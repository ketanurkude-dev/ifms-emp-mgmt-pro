import { useEffect, useState } from "react";
import { get } from "../api/apiService";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import AppLayout from "./AppLayout";

const STAGES = [
  "Forms received",
  "Establishment verification",
  "Service verification",
  "Pay verification",
  "Sanction",
  "PPO issued",
  "First payment authorised",
];

function monthsRemaining(dateOfSuperannuation) {
  const target = new Date(dateOfSuperannuation);
  const now = new Date();
  return Math.max(0, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30)));
}

export default function Pension() {
  const employee = useCurrentEmployee();
  const [pensionCase, setPensionCase] = useState(null);

  useEffect(() => {
    get("/pension/case").then(setPensionCase);
  }, []);

  const stageIndex = pensionCase ? STAGES.indexOf(pensionCase.stage) : -1;

  return (
    <AppLayout>
      <div className="space-y-6">
        {employee && (
          <div className="bg-orange-50 border border-orange-200 rounded p-4 text-sm text-orange-800">
            Superannuation on {employee.date_of_superannuation} —{" "}
            {monthsRemaining(employee.date_of_superannuation)} months remaining.
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">Pension case tracking</h1>
          <p className="text-sm text-slate-500 mb-6">
            {pensionCase?.is_family_pension ? "Family pension case" : "Own pension case"}
          </p>

          {!pensionCase ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <>
              <ol className="flex flex-wrap gap-2 mb-6">
                {STAGES.map((stage, i) => (
                  <li
                    key={stage}
                    className={`text-xs font-medium px-3 py-1.5 rounded border ${
                      i <= stageIndex
                        ? "bg-teal-800 text-white border-teal-800"
                        : "bg-white text-slate-400 border-slate-200"
                    }`}
                  >
                    {i + 1}. {stage}
                  </li>
                ))}
              </ol>

              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>Forms completion</span>
                <span>{pensionCase.forms_completion_percent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded overflow-hidden">
                <div
                  className="h-full bg-teal-700"
                  style={{ width: `${pensionCase.forms_completion_percent}%` }}
                />
              </div>

              {pensionCase.remarks && (
                <div className="mt-5 bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
                  Deficiency memo: {pensionCase.remarks}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
