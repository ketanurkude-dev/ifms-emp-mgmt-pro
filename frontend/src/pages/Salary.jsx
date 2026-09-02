import { useEffect, useState } from "react";
import { downloadFile, get } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AppLayout from "./AppLayout";

const monthFormatter = new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" });

function formatMonth(dateStr) {
  return monthFormatter.format(new Date(dateStr));
}

export default function Salary() {
  const { t } = useLanguage();
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
        <p className="text-slate-500 text-sm">{t("loading")}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded p-6">
          <h1 className="font-semibold text-slate-800 mb-1">{t("salarySlips")}</h1>
          <p className="text-sm text-slate-500 mb-5">{t("salarySlipsSubtitle")}</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-200">
                  <th className="py-2 pr-4">{t("month")}</th>
                  <th className="py-2 pr-4 text-right">{t("gross")}</th>
                  <th className="py-2 pr-4 text-right">{t("deductions")}</th>
                  <th className="py-2 pr-4 text-right">{t("net")}</th>
                  <th className="py-2">{t("status")}</th>
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
                        <td className="py-3 text-slate-500">{t("published")} {slip.published_on}</td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-3 text-slate-500 italic">
                        {t("willBePublished")}
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
              {selected ? formatMonth(selected.month) : t("componentBreakup")}
            </h2>
            {selected && (
              <button
                onClick={() =>
                  downloadFile(`/salary/slips/${selected.id}/pdf`, `salary-slip-${selected.month}.pdf`)
                }
                className="text-xs font-medium text-teal-800 border border-teal-700 rounded px-2.5 py-1 hover:bg-teal-50 shrink-0"
              >
                {t("downloadPdf")}
              </button>
            )}
          </div>
          {!selected ? (
            <p className="text-sm text-slate-500">{t("selectPublishedMonth")}</p>
          ) : (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wide text-slate-400 mt-4 mb-2">{t("earnings")}</p>
              <Row label={t("basicPay")} value={selected.basic_pay} />
              <Row label={t("dearnessAllowance")} value={selected.dearness_allowance} />
              <Row label={t("houseRentAllowance")} value={selected.house_rent_allowance} />
              <Row label={t("transportAllowance")} value={selected.transport_allowance} />
              <Row label={t("gross")} value={selected.gross} bold />

              <p className="text-xs uppercase tracking-wide text-slate-400 mt-5 mb-2">{t("deductions")}</p>
              <Row label={t("gpfSubscription")} value={selected.gpf_subscription} />
              <Row label={t("incomeTax")} value={selected.income_tax} />
              <Row label={t("professionalTax")} value={selected.professional_tax} />
              <Row label={t("totalDeductions")} value={selected.deductions} bold />

              <div className="border-t border-slate-200 mt-4 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{t("netPay")}</span>
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
