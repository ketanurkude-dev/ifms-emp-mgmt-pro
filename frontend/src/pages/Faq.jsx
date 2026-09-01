import { useEffect, useState } from "react";
import { get } from "../api/apiService";
import AppLayout from "./AppLayout";

export default function Faq() {
  const [faqs, setFaqs] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    get("/faq").then(setFaqs);
  }, []);

  const filtered = faqs
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const grouped = filtered.reduce((acc, f) => {
    acc[f.category] = acc[f.category] || [];
    acc[f.category].push(f);
    return acc;
  }, {});

  return (
    <AppLayout>
      <div className="bg-white border border-slate-200 rounded p-6">
        <h1 className="font-semibold text-slate-800 mb-4">Frequently asked questions</h1>

        <input
          className="w-full max-w-md border border-slate-300 rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-teal-600"
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {!faqs ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">
            No matching FAQs.{" "}
            <a href="/grievances" className="text-teal-800 font-medium">
              Lodge a grievance instead
            </a>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h2 className="text-sm font-semibold text-slate-800 mb-2">{category}</h2>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                {items.map((f, i) => (
                  <details key={i} className="p-3">
                    <summary className="text-sm font-medium text-slate-700 cursor-pointer">{f.question}</summary>
                    <p className="text-sm text-slate-600 mt-2">{f.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
