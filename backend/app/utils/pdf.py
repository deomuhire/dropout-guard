from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.units import cm
import io
from datetime import date

FACTOR_LABELS = {
    'lack_of_school_material': 'Lack of School Material',
    'lack_of_school_fees': 'Lack of School Fees',
    'job_opportunity': 'Job Opportunity',
    'pregnancy': 'Pregnancy',
    'family_conflicts': 'Family Conflicts',
    'drug_abuse': 'Drug Abuse',
    'lack_of_motivation': 'Family Support',
    'illness': 'Illness',
    'absenteeism': 'Absenteism',
    'bad_discipline': 'Bad Discipline',
    'lack_of_motivation_display': 'Lack of Motivation',
}

DARK_BLUE = colors.HexColor('#1a1a2e')
LIGHT_BG = colors.HexColor('#f8f9fa')
GREY_TEXT = colors.HexColor('#64748b')


def _make_table_style():
    return TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('TEXTCOLOR',  (0, 0), (-1, 0), colors.white),
        ('FONTNAME',   (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0, 0), (-1, -1), 9),
        ('ALIGN',      (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',     (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID',       (0, 0), (-1, -1), 0.3, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ])


def generate_daily_report(school_name, report_date, students_data, class_name=None,
                          summary=None, is_teacher_view=False, location=None):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=1.5*cm, leftMargin=1.5*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle('Title', parent=styles['Heading1'],
        fontSize=18, textColor=DARK_BLUE, spaceAfter=4)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
        fontSize=10, textColor=GREY_TEXT, spaceAfter=2)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'],
        fontSize=13, textColor=DARK_BLUE, spaceBefore=12, spaceAfter=6)
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'],
        fontSize=8, textColor=colors.grey)

    # Title
    elements.append(Paragraph("Student Dropout Risk Report", title_style))
    elements.append(Paragraph("School: " + str(school_name), styles['Normal']))
    if class_name:
        elements.append(Paragraph("Class: " + str(class_name), styles['Normal']))
    if location:
        loc_parts = [location.get(k, '') for k in ('province', 'district', 'sector') if location.get(k)]
        if loc_parts:
            elements.append(Paragraph("Location: " + ", ".join(loc_parts), subtitle_style))
    elements.append(Paragraph("Date: " + str(report_date), styles['Normal']))
    elements.append(Spacer(1, 0.4*cm))

    # Use summary if provided, otherwise compute from students_data
    if summary is None:
        total = len(students_data)
        recorded = [s for s in students_data if s.get('has_record')]
        at_risk = sum(1 for s in students_data if s.get('at_risk'))
        safe = len(recorded) - at_risk
        pending = total - len(recorded)
        summary = {
            'total_students': total, 'total_recorded': len(recorded),
            'at_risk_count': at_risk, 'safe_count': safe, 'pending_count': pending,

            'class_stats': {},
        }

    # 1. KPI Summary
    elements.append(Paragraph("1. Overview", section_style))
    kpi_data = [
        ['Total Students', 'Recorded', 'At Risk', 'Safe', 'Pending'],
        [str(summary.get('total_students', 0)),
         str(summary.get('total_recorded', 0)),
         str(summary.get('at_risk_count', 0)),
         str(summary.get('safe_count', 0)),
         str(summary.get('pending_count', 0))]
    ]
    kpi_table = Table(kpi_data, colWidths=[3.2*cm]*5)
    kpi_table.setStyle(_make_table_style())
    elements.append(kpi_table)
    elements.append(Spacer(1, 0.4*cm))

    # 2. Gender Distribution
    gender_counts = summary.get('gender_counts', {})
    if gender_counts:
        elements.append(Paragraph("3. Gender Distribution", section_style))
        gender_data = [['Gender', 'Count', 'Percentage']]
        total_g = sum(gender_counts.values()) or 1
        for g in ['Male', 'Female', 'Unknown']:
            cnt = gender_counts.get(g, 0)
            gender_data.append([g, str(cnt), "{:.1f}%".format(cnt/total_g*100)])
        gender_table = Table(gender_data, colWidths=[5*cm, 5*cm, 5*cm])
        gender_table.setStyle(_make_table_style())
        elements.append(gender_table)
        elements.append(Spacer(1, 0.4*cm))

    # 4. Performance Distribution
    perf_summary = summary.get('performance_summary', [])
    if perf_summary:
        elements.append(Paragraph("3. Performance Distribution", section_style))
        perf_data = [['Performance Level', 'Total', 'At Risk']]
        for p in perf_summary:
            perf_data.append([
                p.get('name', ''), str(p.get('total', 0)),
                str(p.get('at_risk', 0))
            ])
        perf_table = Table(perf_data, colWidths=[6*cm, 4*cm, 4*cm])
        perf_table.setStyle(_make_table_style())
        elements.append(perf_table)
        elements.append(Spacer(1, 0.4*cm))

    # 5. Risk Factor Analysis
    risk_factors = summary.get('risk_factors', {})
    if risk_factors and any(v > 0 for v in risk_factors.values()):
        elements.append(Paragraph("5. Risk Factor Analysis", section_style))
        rf_data = [['Risk Factor', 'Count']]
        for key, val in sorted(risk_factors.items(), key=lambda x: -x[1]):
            if val > 0:
                label = FACTOR_LABELS.get(key, key.replace('_', ' ').title())
                rf_data.append([label, str(val)])
        if len(rf_data) == 1:
            rf_data.append(['No risk factors recorded', '0'])
        rf_table = Table(rf_data, colWidths=[10*cm, 4*cm])
        rf_table.setStyle(_make_table_style())
        elements.append(rf_table)
        elements.append(Spacer(1, 0.4*cm))

    # 6. Social Activity Distribution
    social_activities = summary.get('social_activities', {})
    if social_activities:
        elements.append(Paragraph("7. Social Activity Distribution", section_style))
        sa_data = [['Social Activity', 'Count']]
        for sa_name, sa_val in sorted(social_activities.items(), key=lambda x: -x[1]):
            sa_data.append([sa_name, str(sa_val)])
        sa_table = Table(sa_data, colWidths=[10*cm, 4*cm])
        sa_table.setStyle(_make_table_style())
        elements.append(sa_table)
        elements.append(Spacer(1, 0.4*cm))

    # 7. Class Distribution (not for teacher view)
    class_stats = summary.get('class_stats', {})
    if class_stats and not is_teacher_view:
        elements.append(Paragraph("7. Students by Class", section_style))
        cs_data = [['Class', 'Total', 'At Risk', 'Safe', 'Pending']]
        for cls_name, stats in sorted(class_stats.items()):
            cs_data.append([
                cls_name, str(stats.get('total', 0)),
                str(stats.get('at_risk', 0)), str(stats.get('safe', 0)),
                str(stats.get('pending', 0))
            ])
        cs_table = Table(cs_data, colWidths=[4*cm, 2.5*cm, 2.5*cm, 2.5*cm, 2.5*cm])
        cs_table.setStyle(_make_table_style())
        elements.append(cs_table)
        elements.append(Spacer(1, 0.4*cm))

    # 8. Student Detail Table
    elements.append(PageBreak())
    section_num = 7 if is_teacher_view else 8
    elements.append(Paragraph(str(section_num) + ". Student Details", section_style))
    elements.append(Spacer(1, 0.2*cm))

    header = ['#', 'Name', 'ID', 'Class', 'Gender', 'Village', 'Guardian', 'Perf.', 'Status']
    rows = [header]

    for i, s in enumerate(students_data, 1):
        if s.get('at_risk') is True:
            status = 'AT RISK'
        elif s.get('has_record') is False:
            status = 'Pending'
        else:
            status = 'Safe'

        name = s.get('name', '') or s.get('student', {}).get('name', '')
        sid = s.get('student_id', '') or s.get('student', {}).get('student_id', '')
        class_name_val = s.get('class_name', '') or s.get('student', {}).get('class_name', '') or '-'
        gender = s.get('gender', '') or s.get('student', {}).get('gender', '') or '-'
        village = s.get('village', '') or s.get('student', {}).get('village', '')
        guardian = s.get('guardian', '') or s.get('student', {}).get('guardian', '')

        rows.append([str(i), name, sid, class_name_val, gender, village, guardian,
                     s.get('performance', '') or '-', status])

    col_widths = [0.7*cm, 2.8*cm, 1.8*cm, 1.8*cm, 1.3*cm, 2.8*cm, 2.8*cm, 1.3*cm, 1.5*cm]
    student_table = Table(rows, colWidths=col_widths, repeatRows=1)
    student_table.setStyle(_make_table_style())

    for i, s in enumerate(students_data, 1):
        if s.get('at_risk'):
            student_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#ffe0e0')),
            ]))
        elif s.get('has_record') is False:
            student_table.setStyle(TableStyle([
                ('BACKGROUND', (0, i), (-1, i), colors.HexColor('#f0f0f0')),
            ]))

    elements.append(student_table)
    elements.append(Spacer(1, 0.5*cm))

    # 10. Risk Factors per Student (only at-risk students with their top factors)
    at_risk_with_factors = []
    for s in students_data:
        if not s.get('at_risk'):
            continue
        factors = []
        for fk, fl in FACTOR_LABELS.items():
            if s.get(fk):
                factors.append(fl)
        name = s.get('name', '') or s.get('student', {}).get('name', '')
        class_name_val = s.get('class_name', '') or s.get('student', {}).get('class_name', '') or '-'
        at_risk_with_factors.append((name, class_name_val, factors))

    if at_risk_with_factors:
        elements.append(PageBreak())
        elements.append(Paragraph(str(section_num + 1) + ". Risk Factors per At-Risk Student", section_style))
        rf_detail_data = [['#', 'Student Name', 'Class', 'Risk Factors']]
        for idx, (sname, sclas, sfactors) in enumerate(at_risk_with_factors, 1):
            factors_str = ', '.join(sfactors) if sfactors else 'No specific factors'
            rf_detail_data.append([str(idx), sname, sclas, factors_str])
        rf_detail_table = Table(rf_detail_data, colWidths=[0.7*cm, 3*cm, 2*cm, 8.5*cm])
        rf_detail_table.setStyle(_make_table_style())
        elements.append(rf_detail_table)
        elements.append(Spacer(1, 0.5*cm))

    # Footer
    elements.append(Spacer(1, 0.3*cm))
    elements.append(Paragraph(
        "Generated on " + date.today().strftime('%B %d, %Y') + " | Dropout Risk Prediction System",
        footer_style
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()
