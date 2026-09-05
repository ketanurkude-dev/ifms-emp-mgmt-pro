# Employee Portal (emp_mgmt_pro) -- context for future work

Part of the IFMS prototype suite (4 independent apps under `E:\IFMS`): Employee Portal, Pensioner
Portal, Vendor Portal, and a back-office Admin Portal that talks to all three over their APIs.
Modeled on real GNCTD SRS documents for a self-service employee portal (leave/advances/certificates/
grievances/GPF/tax/pension-initiation).

## Stack & ports
- Backend: FastAPI + SQLAlchemy 2.0 (`Mapped`/`mapped_column`) + PostgreSQL. Runs on **:8000**.
- Frontend: React (Vite) + Tailwind CSS (strictly Tailwind, no inline CSS). Runs on **:5173**.
- DB: `postgresql+psycopg2://emp_portal:emp_portal@localhost:5432/emp_portal` (see `backend/.env`).
- No migrations tool -- `Base.metadata.create_all()` on startup creates missing tables only. New
  columns on existing tables need a manual `ALTER TABLE` (see e.g. vendor_mgmt's `stored_path`).

## Non-negotiable project conventions (apply to every portal, not just this one)
- Keep code simple enough for a junior dev to follow -- no premature abstraction.
- Tailwind CSS only, never inline `style=` CSS.
- Every table has `AuditMixin`: `is_active`, `is_deleted`, `server_date`, `operation_date`.
- Boolean DB columns stay native SQLAlchemy `Boolean` -- **do not** convert to `VARCHAR(1)` Y/N.
  This was explicitly proposed and explicitly rejected by the project owner (scope: 19+ bool
  columns, 100+ query filters, 30+ Pydantic bool fields, unknown frontend truthy-check count, and
  JS treats the string `"N"` as truthy which would silently break UI toggles).
- Hand-drawn SVG icons only (see `frontend/src/pages/Icons.jsx`) -- no icon library, no emoji.
- Never run git/GitHub commands yourself -- always give the user the exact command to run.

## Auth pattern (same shape in every portal, including admin_portal)
Two-step JWT login: `POST /auth/login` (employee_code + password) returns a short-lived
`pending_token` (`purpose: "otp_pending"`) -> `POST /auth/verify-otp` (any 6 digits accepted, OTP is
mocked) returns the real `access_token` (`purpose: "access"`). `bcrypt` used directly, not passlib.

## Key backend modules
- `app/models.py` -- `Employee`, `EmployeeRequest`, `Certificate`, `Circular`, `Grievance`, GPF/tax/
  pension records, `AuditLog`.
- `app/events.py` -- `log_action()` helper that writes an `AuditLog` row (correlation id via
  `uuid.uuid4().hex[:12]`); routers call it, then `db.commit()`.
- `app/routers/reports.py` -- `_status_counts()` helper; approver-only pipeline reports plus a
  `my-summary` report any employee can see. `app/routers/audit.py` -- searchable/CSV-exportable
  audit trail (`app/csv_export.py` has the CSV helper), approver-gated.
- `app/routers/approver.py` -- generic `POST /approver/{kind}/{item_id}/review` where kind is
  `request` or `certificate`, plus `GET /approver/queue`. **This is the endpoint admin_portal's
  service account calls** -- do not change its request/response shape without also updating
  `admin_portal/backend/app/integrations.py`.

## Frontend notes
- Custom bilingual i18n, no library: `src/i18n/translations.js` is key-based (`I18N.en[key]`).
- `src/pages/ApplicationDateField.jsx` -- shared read-only "Application date" field
  (`new Date().toISOString().slice(0,10)`), placed at the top of every request/application/register
  form per an explicit requirement that the date be visible on the form itself, not just in result
  tables. The authoritative date is still the backend's `server_date`; this is a UI cue only.
- Result tables should show an "Application date" / "Requested on" column wherever a request is
  listed -- this was retrofitted once already (Requests, Certificates, Grievances, Approver queue
  cards) after an explicit ask; keep it in mind for any new list view.

## Reviewer / approver accounts
No auto-seeded demo accounts (unlike vendor_mgmt) -- employees register via the Register form.
A DDO/HOD-role test account (`employee_code=DDOTEST001`, password `test123`) was created manually
during testing and is now also used as **admin_portal's service account credential** for its
employee-portal integration (see `admin_portal/backend/.env`). If this account is ever deleted or
its password changed, update `admin_portal/backend/.env` (`EMPLOYEE_SERVICE_*`) to match.

## Status (as of 2026-09-03)
Reports/MIS and Audit Log are implemented and tested (mirrored from vendor_mgmt's earlier
implementation). Application Date is on every form and result table. Roughly ~85% of SRS-derived
functional coverage by the project owner's own informal estimate; remaining gaps are mostly
real-integration items explicitly out of scope for this prototype (e.g. real PAN/bank verification
API calls -- functionality is demoed with mocked verification instead).

## Related
See `E:\IFMS\admin_portal\CONTEXT.md` for how the back-office Admin Portal calls into this app's
`/approver/*` endpoints via a service account, and `E:\IFMS\TESTING_GUIDE.md` for cross-portal
end-to-end test steps.
