from datetime import date

from app.models import Faq, GpfLedgerEntry, SalarySlip, TaxDocument

FAQ_CONTENT = [
    ("Salary", "When is my salary slip published?", "Slips are published after bill passing, usually within the first week of the following month."),
    ("Salary", "Why does my net pay change month to month?", "Net pay varies with arrears, voluntary deductions and any advance instalments recovered that month."),
    ("GPF", "How is GPF interest calculated?", "Interest is calculated monthly on the running balance at the rate notified by the Government for that year."),
    ("GPF", "Can I withdraw from my GPF before retirement?", "Yes, for specific permitted purposes, by raising a GPF withdrawal request from the Requests page."),
    ("Requests", "How long does approval usually take?", "Most requests are reviewed by your DDO within a few working days. You can track status on the Requests page."),
    ("Requests", "Can I withdraw a request after submitting it?", "Yes, as long as it is still in 'Submitted' status and has not yet been reviewed."),
    ("Tax", "Which tax regime should I choose?", "This depends on your deductions and income; consult the comparison note on the Tax page before deciding."),
    ("Tax", "What happens if my 80C declaration exceeds the ceiling?", "The portal will show a ceiling warning and will not let the declared amount exceed Rs. 1,50,000."),
    ("Certificates", "How long does a certificate take to issue?", "Once approved by your DDO, a certificate number and signed copy are issued the same day."),
    ("Pension", "When should I start my pension case?", "You should begin filing forms at least a year before your date of superannuation."),
    ("Grievance", "How do I escalate an unresolved grievance?", "If your grievance is not addressed in time, it is automatically flagged for escalation to the Head of Department."),
    ("Grievance", "Can I reopen a closed grievance?", "Yes, within 30 days of closure, using the Reopen button on the grievance record."),
]


def build_faqs() -> list[Faq]:
    return [Faq(category=category, question=question, answer=answer) for category, question, answer in FAQ_CONTENT]


def _months_back(count: int) -> list[date]:
    """First-of-month dates for the last `count` months, oldest first."""
    today = date.today()
    months = []
    for months_ago in range(count - 1, -1, -1):
        year = today.year
        month = today.month - months_ago
        while month <= 0:
            month += 12
            year -= 1
        months.append(date(year, month, 1))
    return months


def build_salary_slips(employee_id: int, basic_pay: float) -> list[SalarySlip]:
    """Create 12 months of mock salary slips for a newly registered employee,
    so the Salary page has data to show right away. The current month is
    left unpublished, like a real payroll cycle."""

    dearness_allowance = round(basic_pay * 0.46, 2)  # roughly current DA rate
    house_rent_allowance = round(basic_pay * 0.27, 2)
    transport_allowance = round(basic_pay * 0.05, 2)
    gross = round(basic_pay + dearness_allowance + house_rent_allowance + transport_allowance, 2)

    gpf_subscription = round(basic_pay * 0.10, 2)
    income_tax = round(gross * 0.05, 2)
    professional_tax = 200.00
    deductions = round(gpf_subscription + income_tax + professional_tax, 2)
    net = round(gross - deductions, 2)

    today = date.today()
    slips = []
    for slip_month in _months_back(12):
        is_current_month = slip_month.year == today.year and slip_month.month == today.month
        slips.append(
            SalarySlip(
                employee_id=employee_id,
                month=slip_month,
                basic_pay=basic_pay,
                dearness_allowance=dearness_allowance,
                house_rent_allowance=house_rent_allowance,
                transport_allowance=transport_allowance,
                gpf_subscription=gpf_subscription,
                income_tax=income_tax,
                professional_tax=professional_tax,
                gross=gross,
                deductions=deductions,
                net=net,
                published_on=None if is_current_month else date(slip_month.year, slip_month.month, 7),
            )
        )
    return slips


def previous_financial_year_label() -> str:
    """Indian financial year runs April to March. Returns the label for the
    one that ended before the current one, e.g. "2025-26"."""
    today = date.today()
    end_year = today.year if today.month >= 4 else today.year - 1
    start_year = end_year - 1
    return f"{start_year}-{str(end_year)[2:]}"


def build_tax_documents(employee_id: int) -> list[TaxDocument]:
    """Issue Form 16 for the last completed financial year, so the Tax
    Documents page has something real to download right away."""

    fy = previous_financial_year_label()
    end_year = int(fy.split("-")[0]) + 1
    issued_on = date(end_year, 6, 15)  # Form 16 is typically issued by mid-June

    return [
        TaxDocument(employee_id=employee_id, financial_year=fy, doc_type="Form 16 Part A", issued_on=issued_on),
        TaxDocument(employee_id=employee_id, financial_year=fy, doc_type="Form 16 Part B", issued_on=issued_on),
    ]


def build_gpf_ledger(employee_id: int, basic_pay: float) -> list[GpfLedgerEntry]:
    """Create 12 months of mock GPF ledger entries matching the salary slips'
    GPF subscription amount, with a simple running balance."""

    subscription = round(basic_pay * 0.10, 2)
    interest = round(subscription * 0.07 / 12, 2)
    balance = 0.0

    entries = []
    for month in _months_back(12):
        balance = round(balance + subscription + interest, 2)
        entries.append(
            GpfLedgerEntry(
                employee_id=employee_id,
                month=month,
                subscription=subscription,
                advance=0,
                withdrawal=0,
                refund=0,
                interest=interest,
                closing_balance=balance,
            )
        )
    return entries
