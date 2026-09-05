import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { post } from "../api/apiService";
import { useLanguage } from "../i18n/LanguageContext";
import AuthLayout from "./AuthLayout";

const emptyForm = {
  employee_code: "",
  name: "",
  email: "",
  mobile: "",
  designation: "",
  office: "",
  ddo_code: "",
  date_of_joining: "",
  date_of_superannuation: "",
  basic_pay: "",
  password: "",
  role: "employee",
};

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/auth/register", {
        ...form,
        basic_pay: Number(form.basic_pay),
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-slate-300 rounded-md px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <AuthLayout title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>{t("applicationDate")}</label>
            <input
              type="text"
              value={new Date().toISOString().slice(0, 10)}
              readOnly
              className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="employee_code">{t("employeeCode")}</label>
            <input id="employee_code" name="employee_code" className={inputClass} value={form.employee_code} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="name">{t("fullName")}</label>
            <input id="name" name="name" className={inputClass} value={form.name} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">{t("email")}</label>
            <input id="email" name="email" type="email" className={inputClass} value={form.email} onChange={handleChange} />
          </div>
          <div>
            <label className={labelClass} htmlFor="mobile">{t("mobile")}</label>
            <input id="mobile" name="mobile" className={inputClass} value={form.mobile} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="designation">{t("designation")}</label>
            <input id="designation" name="designation" className={inputClass} value={form.designation} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="office">{t("office")}</label>
            <input id="office" name="office" className={inputClass} value={form.office} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="ddo_code">{t("ddoCode")}</label>
            <input id="ddo_code" name="ddo_code" className={inputClass} value={form.ddo_code} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="basic_pay">{t("basicPay")}</label>
            <input id="basic_pay" name="basic_pay" type="number" className={inputClass} value={form.basic_pay} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="date_of_joining">{t("dateOfJoining")}</label>
            <input id="date_of_joining" name="date_of_joining" type="date" className={inputClass} value={form.date_of_joining} onChange={handleChange} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="date_of_superannuation">{t("dateOfSuperannuation")}</label>
            <input id="date_of_superannuation" name="date_of_superannuation" type="date" className={inputClass} value={form.date_of_superannuation} onChange={handleChange} required />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="password">{t("password")}</label>
            <input id="password" name="password" type="password" className={inputClass} value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} htmlFor="role">{t("roleForDemo")}</label>
            <select id="role" name="role" className={inputClass} value={form.role} onChange={handleChange}>
              <option value="employee">{t("role_employee")}</option>
              <option value="ddo">{t("role_ddo_approver")}</option>
              <option value="hod">{t("role_hod_approver")}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 text-white rounded-md py-2.5 font-medium hover:bg-teal-800 transition-colors disabled:opacity-60"
        >
          {loading ? t("registering") : t("register")}
        </button>

        <p className="text-sm text-slate-500 mt-6 text-center">
          {t("alreadyRegistered")}{" "}
          <Link to="/login" className="text-teal-700 font-medium hover:text-teal-800">
            {t("signInLink")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
