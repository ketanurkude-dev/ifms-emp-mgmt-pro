import os
from datetime import datetime

from fpdf import FPDF

from app.models import Employee
from app.signing import SIGNER_NAME, sign_pdf

# Every generated PDF shares this letterhead + footer so they look like they
# belong to the same system. Kept deliberately plain (no logos/QR) --
# this is a prototype, not a production document generator.

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")

# Per the bilingual requirement, PDFs must render Devanagari correctly, not
# as an image. Noto Sans Devanagari also covers basic Latin, so one font
# family is used for both languages -- avoids width/metric mismatches from
# font-switching mid-document.
PDF_HI = {
    "Government of NCT of Delhi": "राष्ट्रीय राजधानी क्षेत्र दिल्ली सरकार",
    "Integrated Financial Management System - Employee Portal": "एकीकृत वित्तीय प्रबंधन प्रणाली - कर्मचारी पोर्टल",
    "Reference": "संदर्भ",
    "Generated on": "पर तैयार किया गया",
    "Digitally signed by": "द्वारा डिजिटल हस्ताक्षरित",
    "Prototype - mock data only. Not connected to IFMS.": "प्रोटोटाइप - केवल नमूना डेटा। आईएफएमएस से जुड़ा नहीं है।",
    "Employee name": "कर्मचारी का नाम",
    "Employee code": "कर्मचारी कोड",
    "Designation": "पदनाम",
    "Office": "कार्यालय",
    "DDO code": "डीडीओ कोड",
    "Salary Slip": "वेतन पर्ची",
    "Earnings": "आय",
    "Basic pay": "मूल वेतन",
    "Dearness allowance": "महंगाई भत्ता",
    "House rent allowance": "मकान किराया भत्ता",
    "Transport allowance": "परिवहन भत्ता",
    "Gross": "सकल",
    "Deductions": "कटौती",
    "GPF subscription": "जीपीएफ अभिदान",
    "Income tax": "आयकर",
    "Professional tax": "व्यावसायिक कर",
    "Total deductions": "कुल कटौती",
    "Net pay": "नेट वेतन",
    "Certificate": "प्रमाण पत्र",
    "Purpose": "उद्देश्य",
    "This is to certify that the particulars of":
        "यह प्रमाणित किया जाता है कि",
    "(Employee code": "(कर्मचारी कोड",
    "recorded above are correct as per departmental records, issued for the stated purpose.":
        "के ऊपर दर्ज विवरण विभागीय रिकॉर्ड के अनुसार सही हैं, तथा उल्लिखित उद्देश्य हेतु जारी किए गए हैं।",
    "Certificate number": "प्रमाण पत्र संख्या",
    "Issued on": "जारी तिथि",
    "This document is issued for Financial Year": "यह दस्तावेज़ वित्तीय वर्ष",
    "in respect of": "के संबंध में जारी किया गया है",
    "Document type": "दस्तावेज़ प्रकार",
    "GPF Annual Statement": "जीपीएफ वार्षिक विवरण",
    "GPF series": "जीपीएफ श्रृंखला",
    "Account number": "खाता संख्या",
    "Month": "माह",
    "Subscription": "अभिदान",
    "Advance": "अग्रिम",
    "Withdrawal": "निकासी",
    "Interest": "ब्याज",
    "Closing balance": "समापन शेष",
}


def _t(language: str, key: str) -> str:
    if language == "hi":
        return PDF_HI.get(key, key)
    return key


def _register_font(pdf: FPDF) -> None:
    pdf.add_font("Noto", "", os.path.join(FONT_DIR, "NotoSansDevanagari.ttf"))
    pdf.add_font("Noto", "B", os.path.join(FONT_DIR, "NotoSansDevanagari-Bold.ttf"))
    # Use the bold face for italic too -- there's no separate italic file,
    # and this only affects the small italic footer note.
    pdf.add_font("Noto", "I", os.path.join(FONT_DIR, "NotoSansDevanagari.ttf"))


def _new_pdf(title: str, language: str = "en") -> FPDF:
    pdf = FPDF()
    _register_font(pdf)
    pdf.add_page()
    pdf.set_font("Noto", "B", 14)
    pdf.cell(0, 8, _t(language, "Government of NCT of Delhi"), ln=True, align="C")
    pdf.set_font("Noto", "", 10)
    pdf.cell(0, 6, _t(language, "Integrated Financial Management System - Employee Portal"), ln=True, align="C")
    pdf.ln(4)
    pdf.set_font("Noto", "B", 12)
    pdf.cell(0, 8, title, ln=True, align="C")
    pdf.ln(4)
    return pdf


def _footer(pdf: FPDF, reference: str, language: str = "en") -> None:
    pdf.ln(10)
    pdf.set_font("Noto", "I", 8)
    pdf.multi_cell(
        0,
        5,
        f"{_t(language, 'Reference')}: {reference}\n"
        f"{_t(language, 'Generated on')} {datetime.utcnow().strftime('%d-%m-%Y %H:%M')} UTC.\n"
        f"{_t(language, 'Digitally signed by')} {SIGNER_NAME}.\n"
        f"{_t(language, 'Prototype - mock data only. Not connected to IFMS.')}",
    )


def _employee_block(pdf: FPDF, employee: Employee, language: str = "en") -> None:
    pdf.set_font("Noto", "", 10)
    rows = [
        (_t(language, "Employee name"), employee.name),
        (_t(language, "Employee code"), employee.employee_code),
        (_t(language, "Designation"), employee.designation),
        (_t(language, "Office"), employee.office),
        (_t(language, "DDO code"), employee.ddo_code),
    ]
    for label, value in rows:
        pdf.cell(50, 6, label)
        pdf.cell(0, 6, str(value), ln=True)
    pdf.ln(2)


def _kv_table(pdf: FPDF, rows: list[tuple[str, str]]) -> None:
    pdf.set_font("Noto", "", 10)
    for label, value in rows:
        pdf.cell(90, 7, label, border=1)
        pdf.cell(0, 7, str(value), border=1, ln=True, align="R")


def build_salary_slip_pdf(employee: Employee, slip, language: str = "en") -> bytes:
    t = lambda key: _t(language, key)  # noqa: E731
    pdf = _new_pdf(f"{t('Salary Slip')} - {slip.month.strftime('%B %Y')}", language)
    _employee_block(pdf, employee, language)

    pdf.set_font("Noto", "B", 10)
    pdf.cell(0, 7, t("Earnings"), ln=True)
    _kv_table(
        pdf,
        [
            (t("Basic pay"), f"Rs. {slip.basic_pay}"),
            (t("Dearness allowance"), f"Rs. {slip.dearness_allowance}"),
            (t("House rent allowance"), f"Rs. {slip.house_rent_allowance}"),
            (t("Transport allowance"), f"Rs. {slip.transport_allowance}"),
            (t("Gross"), f"Rs. {slip.gross}"),
        ],
    )
    pdf.ln(3)
    pdf.set_font("Noto", "B", 10)
    pdf.cell(0, 7, t("Deductions"), ln=True)
    _kv_table(
        pdf,
        [
            (t("GPF subscription"), f"Rs. {slip.gpf_subscription}"),
            (t("Income tax"), f"Rs. {slip.income_tax}"),
            (t("Professional tax"), f"Rs. {slip.professional_tax}"),
            (t("Total deductions"), f"Rs. {slip.deductions}"),
        ],
    )
    pdf.ln(3)
    pdf.set_font("Noto", "B", 11)
    pdf.cell(90, 8, t("Net pay"), border=1)
    pdf.cell(0, 8, f"Rs. {slip.net}", border=1, ln=True, align="R")

    _footer(pdf, f"SLIP/{employee.employee_code}/{slip.month.strftime('%Y%m')}", language)
    return sign_pdf(bytes(pdf.output()), reason=f"Salary slip for {slip.month.strftime('%B %Y')}")


def build_certificate_pdf(employee: Employee, certificate, language: str = "en") -> bytes:
    t = lambda key: _t(language, key)  # noqa: E731
    pdf = _new_pdf(f"{certificate.certificate_type} {t('Certificate')}", language)
    _employee_block(pdf, employee, language)

    pdf.set_font("Noto", "", 10)
    pdf.multi_cell(0, 6, f"{t('Purpose')}: {certificate.purpose}")
    pdf.ln(4)
    pdf.multi_cell(
        0,
        6,
        f"{t('This is to certify that the particulars of')} {employee.name} "
        f"{t('(Employee code')} {employee.employee_code}) "
        f"{t('recorded above are correct as per departmental records, issued for the stated purpose.')}",
    )
    pdf.ln(6)
    pdf.set_font("Noto", "B", 10)
    pdf.cell(0, 7, f"{t('Certificate number')}: {certificate.certificate_number}", ln=True)
    pdf.cell(0, 7, f"{t('Issued on')}: {certificate.issued_on}", ln=True)

    _footer(pdf, certificate.certificate_number or "UNISSUED", language)
    return sign_pdf(bytes(pdf.output()), reason=f"Certificate {certificate.certificate_number}")


def build_tax_document_pdf(employee: Employee, document, language: str = "en") -> bytes:
    t = lambda key: _t(language, key)  # noqa: E731
    pdf = _new_pdf(f"{document.doc_type} - FY {document.financial_year}", language)
    _employee_block(pdf, employee, language)

    pdf.set_font("Noto", "", 10)
    pdf.multi_cell(
        0,
        6,
        f"{t('This document is issued for Financial Year')} {document.financial_year} "
        f"{t('in respect of')} {employee.name} ({employee.employee_code}).",
    )
    pdf.ln(4)
    pdf.cell(0, 7, f"{t('Document type')}: {document.doc_type}", ln=True)
    pdf.cell(0, 7, f"{t('Issued on')}: {document.issued_on}", ln=True)

    _footer(pdf, f"TAX/{employee.employee_code}/{document.financial_year}", language)
    return sign_pdf(bytes(pdf.output()), reason=f"{document.doc_type} for FY {document.financial_year}")


def build_gpf_annual_statement_pdf(employee: Employee, entries: list, year_label: str, language: str = "en") -> bytes:
    t = lambda key: _t(language, key)  # noqa: E731
    pdf = _new_pdf(f"{t('GPF Annual Statement')} - {year_label}", language)
    _employee_block(pdf, employee, language)

    pdf.set_font("Noto", "", 9)
    pdf.cell(0, 7, f"{t('GPF series')}: {employee.gpf_series}    {t('Account number')}: {employee.gpf_account_number}", ln=True)
    pdf.ln(3)

    pdf.set_font("Noto", "B", 9)
    headers = [t("Month"), t("Subscription"), t("Advance"), t("Withdrawal"), t("Interest"), t("Closing balance")]
    widths = [30, 32, 28, 30, 28, 40]
    for header, width in zip(headers, widths):
        pdf.cell(width, 7, header, border=1)
    pdf.ln()

    pdf.set_font("Noto", "", 9)
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

    _footer(pdf, f"GPF/{employee.employee_code}/{year_label}", language)
    return sign_pdf(bytes(pdf.output()), reason=f"GPF annual statement {year_label}")
