from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib import colors


class ExportService:

    @staticmethod
    def export_pdf(document):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=2.5 * cm,
            bottomMargin=2.5 * cm,
            leftMargin=2.5 * cm,
            rightMargin=2.5 * cm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle", parent=styles["Title"],
            fontSize=18, leading=22, spaceAfter=12, alignment=TA_CENTER,
            textColor=colors.HexColor("#1a1a2e"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle", parent=styles["Normal"],
            fontSize=10, leading=14, spaceAfter=24, alignment=TA_CENTER,
            textColor=colors.HexColor("#666666"),
        )
        body_style = ParagraphStyle(
            "DocBody", parent=styles["Normal"],
            fontSize=11, leading=16, spaceAfter=8, alignment=TA_JUSTIFY,
        )
        label_style = ParagraphStyle(
            "Label", parent=styles["Normal"],
            fontSize=10, leading=14, spaceAfter=4,
            textColor=colors.HexColor("#888888"),
        )
        bold_style = ParagraphStyle(
            "BoldBody", parent=body_style,
            fontName="Helvetica-Bold", spaceBefore=12,
        )

        elements = []

        elements.append(Paragraph(document.title, title_style))
        if document.template:
            elements.append(Paragraph(document.template.name, subtitle_style))
        else:
            elements.append(Paragraph("Legal Document", subtitle_style))

        elements.append(HRFlowable(
            width="100%", thickness=1,
            color=colors.HexColor("#cccccc"),
            spaceAfter=20,
        ))

        if document.content:
            for line in document.content.split("\n"):
                line = line.strip()
                if not line:
                    continue
                if line.startswith("---"):
                    continue
                if line.startswith("Section ") or line.startswith("Section:"):
                    elements.append(Paragraph(line, bold_style))
                else:
                    elements.append(Paragraph(line, body_style))

        generation_info = (
            f"Generated: {document.updated_at.strftime('%Y-%m-%d %H:%M')} UTC"
            if document.updated_at else "Draft document"
        )
        elements.append(Spacer(1, 24))
        elements.append(HRFlowable(
            width="100%", thickness=0.5,
            color=colors.HexColor("#dddddd"),
            spaceBefore=12, spaceAfter=8,
        ))
        elements.append(Paragraph(generation_info, label_style))

        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes

    @staticmethod
    def export_docx(document):
        raise NotImplementedError("DOCX export not yet implemented")
