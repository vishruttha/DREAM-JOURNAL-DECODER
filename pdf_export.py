"""
=============================================================================
DREAM JOURNAL DECODER - PDF REPORT GENERATION SERVICE
=============================================================================
Generates an elegant, publication-quality PDF report from SQLite dream entries.
Utilizes ReportLab with custom celestial styling, multi-page layout,
running headers/footers with dynamic page numbers, and Unicode handling.
=============================================================================
"""

import io
from datetime import datetime
from typing import List, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas


# Celestial Color Palette for Print & Screen
COLOR_NAVY = HexColor("#070a16")
COLOR_DEEP_VIOLET = HexColor("#2e1065")
COLOR_VIOLET = HexColor("#6d28d9")
COLOR_LIGHT_VIOLET = HexColor("#ede9fe")
COLOR_LAVENDER = HexColor("#7c3aed")
COLOR_GOLD = HexColor("#b45309")
COLOR_LIGHT_GOLD = HexColor("#fef3c7")
COLOR_TEXT_MAIN = HexColor("#0f172a")
COLOR_TEXT_MUTED = HexColor("#475569")
COLOR_TEXT_LIGHT = HexColor("#64748b")
COLOR_BORDER = HexColor("#cbd5e1")
COLOR_CARD_BG = HexColor("#f8fafc")


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and display total page counts
    along with running celestial headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, total_pages):
        self.saveState()

        # Suppress running header/footer on cover page (page 1)
        if self._pageNumber > 1:
            # Running Header
            self.setFont("Helvetica", 8)
            self.setFillColor(COLOR_TEXT_LIGHT)
            self.drawString(54, letter[1] - 36, "Dream Journal Decoder  |  Personal Reflection Report")
            self.drawRightString(letter[0] - 54, letter[1] - 36, datetime.now().strftime("%B %d, %Y"))

            self.setStrokeColor(COLOR_BORDER)
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

            # Running Footer
            self.line(54, 45, letter[0] - 54, 45)
            self.setFont("Helvetica", 8)
            self.setFillColor(COLOR_TEXT_LIGHT)
            self.drawString(54, 32, "Confidential  •  For Personal Introspection Only")
            page_text = f"Page {self._pageNumber} of {total_pages}"
            self.drawRightString(letter[0] - 54, 32, page_text)

        self.restoreState()


def clean_text(text: Any) -> str:
    """Sanitizes text for safe ReportLab XML/HTML entity parsing."""
    if text is None:
        return ""
    text_str = str(text)
    # Replace XML entities
    text_str = text_str.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Safe newline handling for paragraph flow
    text_str = text_str.replace("\n\n", "<br/><br/>").replace("\n", "<br/>")
    return text_str


def generate_journal_pdf(dreams: List[Dict[str, Any]], symbol_rankings: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Builds a complete, publication-grade PDF report from saved SQLite dreams.
    Returns an in-memory BytesIO buffer ready for Flask streaming.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=36,
        textColor=COLOR_DEEP_VIOLET,
        alignment=TA_CENTER,
        spaceAfter=8
    )

    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        fontName='Helvetica',
        fontSize=14,
        leading=18,
        textColor=COLOR_LAVENDER,
        alignment=TA_CENTER,
        spaceAfter=24
    )

    style_cover_meta = ParagraphStyle(
        'CoverMeta',
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=COLOR_TEXT_MUTED,
        alignment=TA_CENTER
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=COLOR_DEEP_VIOLET,
        spaceBefore=14,
        spaceAfter=10,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=COLOR_VIOLET,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    style_dream_title = ParagraphStyle(
        'DreamTitle',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=COLOR_DEEP_VIOLET,
        keepWithNext=True
    )

    style_meta = ParagraphStyle(
        'MetaText',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=COLOR_TEXT_LIGHT
    )

    style_body = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=9.5,
        leading=14.5,
        textColor=COLOR_TEXT_MAIN,
        alignment=TA_LEFT,
        spaceAfter=6
    )

    style_reflection = ParagraphStyle(
        'Reflection',
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=13.5,
        textColor=COLOR_GOLD,
        alignment=TA_LEFT
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_DEEP_VIOLET
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=COLOR_TEXT_MAIN
    )

    story = []

    # =========================================================================
    # 1. COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 1.2 * inch))

    # Decorative Moon Motif Header
    story.append(Paragraph("✦ &nbsp; ☽ &nbsp; ✦", ParagraphStyle('MoonIcon', fontName='Helvetica', fontSize=24, leading=28, alignment=TA_CENTER, textColor=COLOR_VIOLET)))
    story.append(Spacer(1, 12))

    story.append(Paragraph("Dream Journal Decoder", style_cover_title))
    story.append(Paragraph("Personal Dream Journal Report &amp; Motif Analysis", style_cover_subtitle))

    # Decorative rule
    story.append(HRFlowable(width="60%", thickness=1.5, color=COLOR_VIOLET, spaceBefore=10, spaceAfter=25))

    # Overview metadata card on cover
    total_dreams = len(dreams)
    if dreams:
        sorted_dates = sorted([d.get("dream_date", "") for d in dreams if d.get("dream_date")])
        date_range_str = f"{sorted_dates[0]} &nbsp;to&nbsp; {sorted_dates[-1]}" if sorted_dates else "N/A"
    else:
        date_range_str = "No records logged"

    cover_info_text = f"""
    <strong>Report Generated:</strong> {datetime.now().strftime("%B %d, %Y at %I:%M %p")}<br/>
    <strong>Total Recorded Dreams:</strong> {total_dreams}<br/>
    <strong>Date Range:</strong> {date_range_str}<br/>
    <strong>Format:</strong> SQLite Persistent Journal Archive
    """
    story.append(Paragraph(cover_info_text, style_cover_meta))

    story.append(Spacer(1, 2.5 * inch))

    cover_disclaimer = """
    <font size="8" color="#64748b">
    This document contains personal dream narratives, emotional indicators, and recurring symbol patterns.<br/>
    Interpretations are reflective prompts to foster introspection, not clinical psychological diagnoses.
    </font>
    """
    story.append(Paragraph(cover_disclaimer, ParagraphStyle('CoverDisclaimer', fontName='Helvetica', fontSize=8, leading=11, alignment=TA_CENTER)))

    story.append(PageBreak())

    # =========================================================================
    # 2. JOURNAL OVERVIEW & EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("1. Journal Overview &amp; Key Patterns", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceBefore=4, spaceAfter=14))

    if total_dreams == 0:
        story.append(Paragraph("No dream entries have been recorded yet. The journal is currently empty.", style_body))
    else:
        # Calculate summary metrics
        total_words = sum(d.get("word_count", 0) for d in dreams)
        avg_vividness = round(sum(d.get("vividness", 5) for d in dreams) / total_dreams, 1)

        # Count emotions across dreams
        emotion_counts: Dict[str, int] = {}
        for d in dreams:
            for emo in d.get("selected_emotions", []):
                emotion_counts[emo] = emotion_counts.get(emo, 0) + 1

        top_emotions_str = ", ".join([f"{k} ({v})" for k, v in sorted(emotion_counts.items(), key=lambda x: x[1], reverse=True)[:4]]) or "None specified"

        summary_data = [
            [Paragraph("<strong>Total Dreams Recorded</strong>", style_table_cell), Paragraph(str(total_dreams), style_table_cell)],
            [Paragraph("<strong>Total Narrative Words</strong>", style_table_cell), Paragraph(f"{total_words:,} words", style_table_cell)],
            [Paragraph("<strong>Average Vividness (1–10)</strong>", style_table_cell), Paragraph(f"{avg_vividness} / 10", style_table_cell)],
            [Paragraph("<strong>Dominant Emotions</strong>", style_table_cell), Paragraph(top_emotions_str, style_table_cell)],
            [Paragraph("<strong>Archive Period Covered</strong>", style_table_cell), Paragraph(date_range_str, style_table_cell)],
        ]

        summary_table = Table(summary_data, colWidths=[2.2 * inch, 4.8 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), COLOR_CARD_BG),
            ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(summary_table)

    story.append(Spacer(1, 18))

    # =========================================================================
    # 3. RECURRING MOTIFS & SYMBOLS TABLE
    # =========================================================================
    story.append(Paragraph("Recurring Subconscious Motifs", style_h2))
    story.append(Paragraph(
        "The following table ranks motifs frequently identified across your dream narratives, including total occurrences and distinct dream presence:",
        style_body
    ))

    if not symbol_rankings:
        story.append(Paragraph("<em>No recurring symbols detected in the current journal entries.</em>", style_body))
    else:
        symbol_rows = [
            [
                Paragraph("<strong>Rank</strong>", style_table_header),
                Paragraph("<strong>Symbol &amp; Archetype</strong>", style_table_header),
                Paragraph("<strong>Total Occurrences</strong>", style_table_header),
                Paragraph("<strong>Distinct Dreams</strong>", style_table_header),
                Paragraph("<strong>Share (%)</strong>", style_table_header),
            ]
        ]

        for idx, item in enumerate(symbol_rankings[:10], start=1):
            distinct_count = len(item.get("associated_dreams", []))
            symbol_rows.append([
                Paragraph(str(idx), style_table_cell),
                Paragraph(clean_text(item.get("symbol", "")), style_table_cell),
                Paragraph(str(item.get("count", 0)), style_table_cell),
                Paragraph(f"{distinct_count} dream{'s' if distinct_count != 1 else ''}", style_table_cell),
                Paragraph(f"{item.get('percentage', 0)}%", style_table_cell),
            ])

        symbol_table = Table(symbol_rows, colWidths=[0.6 * inch, 2.6 * inch, 1.4 * inch, 1.4 * inch, 1.0 * inch])
        symbol_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_LIGHT_VIOLET),
            ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(symbol_table)

    story.append(Spacer(1, 20))
    story.append(PageBreak())

    # =========================================================================
    # 4. INDIVIDUAL DREAM ENTRIES
    # =========================================================================
    story.append(Paragraph("2. Individual Dream Entries", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=COLOR_BORDER, spaceBefore=4, spaceAfter=14))

    if not dreams:
        story.append(Paragraph("No dream narratives found in the archive.", style_body))
    else:
        for idx, dream in enumerate(dreams, start=1):
            entry_elements = []

            # Entry Title Header
            title_text = f"#{idx}. {clean_text(dream.get('title', 'Untitled Dream'))}"
            entry_elements.append(Paragraph(title_text, style_dream_title))

            # Metadata bar
            date_time = clean_text(dream.get('dream_date', ''))
            if dream.get('dream_time'):
                date_time += f" at {clean_text(dream.get('dream_time'))}"

            vividness_val = dream.get('vividness', 5)
            words_val = dream.get('word_count', len(dream.get('narrative', '').split()))

            meta_line = f"<strong>Date:</strong> {date_time} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Vividness:</strong> {vividness_val}/10 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Length:</strong> {words_val} words"
            entry_elements.append(Paragraph(meta_line, style_meta))

            # Emotions & Tags Pills line
            emotions = dream.get("selected_emotions", [])
            tags = dream.get("tags", [])
            tag_parts = []
            if emotions:
                tag_parts.append(f"<strong>Emotions:</strong> {', '.join(clean_text(e) for e in emotions)}")
            if tags:
                tag_parts.append(f"<strong>Tags:</strong> #{' #'.join(clean_text(t) for t in tags)}")

            if tag_parts:
                entry_elements.append(Spacer(1, 3))
                entry_elements.append(Paragraph(" &nbsp;&bull;&nbsp; ".join(tag_parts), style_meta))

            entry_elements.append(Spacer(1, 6))

            # Narrative Text
            narrative_text = clean_text(dream.get("narrative", ""))
            entry_elements.append(Paragraph(narrative_text, style_body))

            # Detected Symbols & Reflective Prompt (if present)
            symbols = dream.get("derived_symbols", [])
            if symbols:
                sym_names = [f"<strong>{clean_text(s.get('name'))}</strong>" for s in symbols[:3]]
                entry_elements.append(Spacer(1, 3))
                entry_elements.append(Paragraph(f"<font size='8' color='#6d28d9'>✦ Detected Motifs:</font> {', '.join(sym_names)}", style_meta))

            # Personal Reflection (if present)
            reflection = dream.get("reflection", "").strip()
            if reflection:
                entry_elements.append(Spacer(1, 4))
                refl_box = Table(
                    [[Paragraph(f"<strong>Personal Reflection:</strong> &ldquo;{clean_text(reflection)}&rdquo;", style_reflection)]],
                    colWidths=[7.0 * inch]
                )
                refl_box.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, -1), COLOR_LIGHT_GOLD),
                    ('BOX', (0, 0), (-1, -1), 0.5, HexColor("#fde68a")),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                    ('LEFTPADDING', (0, 0), (-1, -1), 8),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 8),
                ]))
                entry_elements.append(refl_box)

            # Divider between dreams
            entry_elements.append(HRFlowable(width="100%", thickness=0.5, color=HexColor("#e2e8f0"), spaceBefore=10, spaceAfter=14))

            # Append entry to story (KeepTogether prevents headers from separating if small,
            # but allow very long narratives to flow across pages)
            if len(narrative_text) < 700:
                story.append(KeepTogether(entry_elements))
            else:
                for el in entry_elements:
                    story.append(el)

    # =========================================================================
    # 5. CLOSING NOTE & DISCLAIMER
    # =========================================================================
    story.append(Spacer(1, 14))
    closing_box = [
        Paragraph("<strong>Closing Note &amp; Reflective Guidance</strong>", ParagraphStyle('CloseH', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=COLOR_DEEP_VIOLET)),
        Spacer(1, 4),
        Paragraph(
            "Dream motifs and recorded emotions represent a snapshot of subconscious contemplation. "
            "They are best explored as personal metaphors rather than literal or scientific prognoses. "
            "Re-reading older dreams alongside current waking circumstances often reveals cycles of creative inspiration, "
            "periods of life transition, and evolving personal clarity.",
            ParagraphStyle('CloseBody', fontName='Helvetica', fontSize=8.5, leading=12.5, textColor=COLOR_TEXT_MUTED)
        )
    ]
    closing_table = Table([[closing_box]], colWidths=[7.0 * inch])
    closing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, COLOR_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(KeepTogether(closing_table))

    # Build PDF with two-pass canvas
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
