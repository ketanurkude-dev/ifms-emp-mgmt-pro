import { useEffect, useState } from "react";
import { get } from "../api/apiService";
import { useCurrentEmployee } from "../api/useCurrentEmployee";
import { useLanguage } from "../i18n/LanguageContext";
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

const STAGE_KEYS = [
  "stage_formsReceived",
  "stage_establishmentVerification",
  "stage_serviceVerification",
  "stage_payVerification",
  "stage_sanction",
  "stage_ppoIssued",
  "stage_firstPaymentAuthorised",
];

function monthsRemaining(dateOfSuperannuation) {
  const target = new Date(dateOfSuperannuation);
  const now = new Date();
  return Math.max(0, Math.round((target - now) / (1000 * 60 * 60 * 24 * 30)));
}

export default function Pension() {
  const { t } = useLanguage();
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
            {t("superannuationOn")} {employee.date_of_superannuation} —{" "}
            {monthsRemaining(employee.date_of_superannuation)} {t("monthsRemaining")}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">{t("pensionCaseTracking")}</h1>
          <p className="text-sm text-slate-500 mb-6">
            {pensionCase?.is_family_pension ? t("familyPensionCase") : t("ownPensionCase")}
          </p>

          {!pensionCase ? (
            <p className="text-sm text-slate-500">{t("loading")}</p>
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
                    {i + 1}. {t(STAGE_KEYS[i])}
                  </li>
                ))}
              </ol>

              <div className="mb-2 flex justify-between text-sm text-slate-600">
                <span>{t("formsCompletion")}</span>
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
                  {t("deficiencyMemo")} {pensionCase.remarks}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
