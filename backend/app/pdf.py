from datetime import datetime

from fpdf import FPDF

from app.models import Employee
from app.signing import SIGNER_NAME, sign_pdf

# Every generated PDF shares this letterhead + footer so they look like they
# belong to the same system. Kept deliberately plain (no logos/QR) --
# this is a prototype, not a production document generator.


def _new_pdf(title: str) -> FPDF:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 8, "Government of NCT of Delhi", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Integrated Financial Management System - Employee Portal", ln=True, align="C")
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, title, ln=True, align="C")
    pdf.ln(4)
    return pdf


def _footer(pdf: FPDF, reference: str) -> None:
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 8)
    pdf.multi_cell(
        0,
        5,
        f"Reference: {reference}\n"
        f"Generated on {datetime.utcnow().strftime('%d-%m-%Y %H:%M')} UTC.\n"
        f"Digitally signed by {SIGNER_NAME}.\n"
        "Prototype - mock data only. Not connected to IFMS.",
    )


def _employee_block(pdf: FPDF, employee: Employee) -> None:
    pdf.set_font("Helvetica", "", 10)
    rows = [
        ("Employee name", employee.name),
        ("Employee code", employee.employee_code),
        ("Designation", employee.designation),
        ("Office", employee.office),
        ("DDO code", employee.ddo_code),
    ]
    for label, value in rows:
        pdf.cell(50, 6, label)
        pdf.cell(0, 6, str(value), ln=True)
    pdf.ln(2)


def _kv_table(pdf: FPDF, rows: list[tuple[str, str]]) -> None:
    pdf.set_font("Helvetica", "", 10)
    for label, value in rows:
        pdf.cell(90, 7, label, border=1)
        pdf.cell(0, 7, str(value), border=1, ln=True, align="R")


def build_salary_slip_pdf(employee: Employee, slip) -> bytes:
    pdf = _new_pdf(f"Salary Slip - {slip.month.strftime('%B %Y')}")
    _employee_block(pdf, employee)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "Earnings", ln=True)
    _kv_table(
        pdf,
        [
            ("Basic pay", f"Rs. {slip.basic_pay}"),
            ("Dearness allowance", f"Rs. {slip.dearness_allowance}"),
            ("House rent allowance", f"Rs. {slip.house_rent_allowance}"),
            ("Transport allowance", f"Rs. {slip.transport_allowance}"),
            ("Gross", f"Rs. {slip.gross}"),
        ],
    )
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, "Deductions", ln=True)
    _kv_table(
        pdf,
        [
            ("GPF subscription", f"Rs. {slip.gpf_subscription}"),
            ("Income tax", f"Rs. {slip.income_tax}"),
            ("Professional tax", f"Rs. {slip.professional_tax}"),
            ("Total deductions", f"Rs. {slip.deductions}"),
        ],
    )
    pdf.ln(3)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(90, 8, "Net pay", border=1)
    pdf.cell(0, 8, f"Rs. {slip.net}", border=1, ln=True, align="R")

    _footer(pdf, f"SLIP/{employee.employee_code}/{slip.month.strftime('%Y%m')}")
    return sign_pdf(bytes(pdf.output()), reason=f"Salary slip for {slip.month.strftime('%B %Y')}")


def build_certificate_pdf(employee: Employee, certificate) -> bytes:
    pdf = _new_pdf(f"{certificate.certificate_type} Certificate")
    _employee_block(pdf, employee)

    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 6, f"Purpose: {certificate.purpose}")
    pdf.ln(4)
    pdf.multi_cell(
        0,
        6,
        f"This is to certify that the particulars of {employee.name} "
        f"(Employee code {employee.employee_code}) recorded above are correct "
        f"as per departmental records, issued for the stated purpose.",
    )
    pdf.ln(6)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 7, f"Certificate number: {certificate.certificate_number}", ln=True)
    pdf.cell(0, 7, f"Issued on: {certificate.issued_on}", ln=True)

    _footer(pdf, certificate.certificate_number or "UNISSUED")
    return sign_pdf(bytes(pdf.output()), reason=f"Certificate {certificate.certificate_number}")


def build_tax_document_pdf(employee: Employee, document) -> bytes:
    pdf = _new_pdf(f"{document.doc_type} - FY {document.financial_year}")
    _employee_block(pdf, employee)

    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(
        0,
        6,
        f"This document is issued for Financial Year {document.financial_year} "
        f"in respect of {employee.name} ({employee.employee_code}).",
    )
    pdf.ln(4)
    pdf.cell(0, 7, f"Document type: {document.doc_type}", ln=True)
    pdf.cell(0, 7, f"Issued on: {document.issued_on}", ln=True)

    _footer(pdf, f"TAX/{employee.employee_code}/{document.financial_year}")
    return sign_pdf(bytes(pdf.output()), reason=f"{document.doc_type} for FY {document.financial_year}")


def build_gpf_annual_statement_pdf(employee: Employee, entries: list, year_label: str) -> bytes:
    pdf = _new_pdf(f"GPF Annual Statement - {year_label}")
    _employee_block(pdf, employee)

    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 7, f"GPF series: {employee.gpf_series}    Account number: {employee.gpf_account_number}", ln=True)
    pdf.ln(3)

    pdf.set_font("Helvetica", "B", 9)
    headers = ["Month", "Subscription", "Advance", "Withdrawal", "Interest", "Closing balance"]
    widths = [30, 32, 28, 30, 28, 40]
    for header, width in zip(headers, widths):
        pdf.cell(width, 7, header, border=1)
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    for entry in entries:
        values = [
            entry.month.strftime("%b %Y"),
            f"Rs. {entry.subscription}",
            f"Rs. {entry.advance}",
            f"Rs. {entry.withdrawal}",
            f"Rs. {entry.interest}",
            f"Rs. {entry.closing_balance}",
        ]
        for value, width in zip(values, widths):
            pdf.cell(width, 7, str(value), border=1)
        pdf.ln()

    _footer(pdf, f"GPF/{employee.employee_code}/{year_label}")
    return sign_pdf(bytes(pdf.output()), reason=f"GPF annual statement {year_label}")
