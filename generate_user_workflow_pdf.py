from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parent
OUTPUT_FILE = ROOT / "College_Management_System_End_User_Manual.pdf"
HERO_IMAGE = ROOT / "frontend" / "src" / "assets" / "hero.png"


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="GuideTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#173A5E"),
            spaceAfter=12,
        )
    )
    styles.add(
        ParagraphStyle(
            name="GuideSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#4B5D72"),
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0F4C81"),
            spaceBefore=10,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1D3557"),
            spaceBefore=8,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Body",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=10.5,
            leading=15,
            spaceAfter=6,
            textColor=colors.HexColor("#243447"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="Callout",
            parent=styles["BodyText"],
            fontName="Helvetica-Oblique",
            fontSize=10,
            leading=14,
            leftIndent=10,
            rightIndent=10,
            textColor=colors.HexColor("#415A77"),
            backColor=colors.HexColor("#F5F9FF"),
            borderPadding=8,
            borderColor=colors.HexColor("#D6E6F2"),
            borderWidth=0.5,
            borderRadius=4,
            spaceBefore=4,
            spaceAfter=8,
        )
    )
    return styles


def numbered_steps(styles, steps):
    return ListFlowable(
        [
            ListItem(Paragraph(step, styles["Body"]), value=index)
            for index, step in enumerate(steps, start=1)
        ],
        bulletType="1",
        leftIndent=18,
    )


def bullet_list(styles, items):
    return ListFlowable(
        [ListItem(Paragraph(item, styles["Body"])) for item in items],
        bulletType="bullet",
        leftIndent=18,
    )


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#4B5D72"))
    canvas.drawRightString(doc.pagesize[0] - 36, 24, f"Page {doc.page}")
    canvas.restoreState()


def credentials_table():
    rows = [
        ["Role", "Email", "Password", "Result after login"],
        ["Admin", "admin@college.edu", "admin123", "Opens /admin/dashboard"],
        ["HOD", "hod@college.edu", "faculty123", "Opens /hod/dashboard"],
        ["Faculty", "faculty1@college.edu", "faculty123", "Opens /faculty/dashboard"],
        ["Student", "student1@college.edu", "student123", "Opens /student/dashboard"],
    ]
    table = Table(rows, colWidths=[1.05 * inch, 2.15 * inch, 1.2 * inch, 2.0 * inch], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F4C81")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9.5),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B7C9D6")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def role_permissions_table():
    rows = [
        ["Role", "Main purpose in website", "What this role can do"],
        [
            "Public Visitor",
            "Access public information and create an account",
            "View home, about, and contact pages; open register page; create a new account; open login page",
        ],
        [
            "Student",
            "Use self-service academic and campus facilities",
            "View dashboard, attendance, timetable, results, fees, notifications, placements, library, certificates, hostel, transport, materials, complaints, service requests, request status, and documents",
        ],
        [
            "Faculty",
            "Manage teaching and classroom academic work",
            "View dashboard, profile, timetable, notifications; mark attendance; use face attendance; enter marks; upload results; manage assignments; upload study materials; review students; request leave; view payslips",
        ],
        [
            "HOD",
            "Manage department-level academic supervision",
            "Open HOD console; review department faculty and department overview; manage courses and timetable; approve leave; review department notifications",
        ],
        [
            "Admin",
            "Control institution-wide academic and administrative modules",
            "Manage students, faculty, departments, courses, admissions, attendance, exams, results, fees, timetable, notifications, library, placements, hostel, transport, payroll, scholarships, events, certificates, reports, and approvals",
        ],
    ]
    table = Table(
        rows,
        colWidths=[1.05 * inch, 1.85 * inch, 4.1 * inch],
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D3557")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 11),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#B7C9D6")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def build_story():
    styles = build_styles()
    story = []

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("College Management System", styles["GuideTitle"]))
    story.append(Paragraph("End User Manual", styles["GuideTitle"]))
    story.append(
        Paragraph(
            "Prepared from the current project structure and role-based pages in the CampusOne / EduManager web application.",
            styles["GuideSubtitle"],
        )
    )
    story.append(
        Paragraph(
            f"Document date: {date.today().strftime('%d %B %Y')}",
            styles["GuideSubtitle"],
        )
    )
    story.append(Spacer(1, 0.15 * inch))

    if HERO_IMAGE.exists():
        story.append(Image(str(HERO_IMAGE), width=6.5 * inch, height=3.0 * inch))
        story.append(Spacer(1, 0.15 * inch))

    story.append(
        Paragraph(
            "This end user manual explains how a user can open the website, sign in, move through the menu, and complete the main tasks available for public visitors, students, faculty, HOD, and admin users.",
            styles["Callout"],
        )
    )

    story.append(Paragraph("1. Website Access", styles["SectionTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open the website in your browser. The public landing page shows the college home screen with the main navigation and action buttons like <b>Apply Now</b> and <b>Login</b>.",
                "If you are a new visitor, start from the public pages: <b>Home</b>, <b>About</b>, <b>Contact</b>, and <b>Register</b>.",
                "If you already have an account, open the <b>Login</b> page.",
                "After login, the system automatically redirects you to the correct dashboard based on your role.",
            ],
        )
    )

    story.append(Paragraph("2. Demo Login Credentials", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "The project README and login page include seeded demo accounts. Use the following credentials when the sample database has been loaded:",
            styles["Body"],
        )
    )
    story.append(credentials_table())
    story.append(Spacer(1, 0.1 * inch))
    story.append(
        Paragraph(
            "Important note: On the login screen, the user first selects a role. Faculty users must also choose either <b>HOD Login</b> or <b>Faculty Login</b> before submitting email and password.",
            styles["Callout"],
        )
    )

    story.append(Paragraph("3. Role Overview", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "Before using the website, it helps to understand what each role is expected to do inside the system. The table below summarizes role-based usage.",
            styles["Body"],
        )
    )
    story.append(role_permissions_table())
    story.append(
        Paragraph(
            "The website is role-based, so each user will only see the menu items and workflows relevant to that role after login.",
            styles["Callout"],
        )
    )

    story.append(Paragraph("4. Public Visitor Flow", styles["SectionTitle"]))
    story.append(Paragraph("A. Home Page", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open the landing page to view the college introduction, feature cards, statistics, testimonials, and footer contact information.",
                "Use <b>Apply Now</b> to move to the registration page.",
                "Use <b>Login</b> if you already have a student, faculty, HOD, or admin account.",
            ],
        )
    )
    story.append(Paragraph("B. Register Page", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open <b>Register</b> from the navbar or the home page.",
                "Enter <b>Full name</b>, <b>Email</b>, and <b>Password</b>.",
                "Choose the <b>Role</b> from Student, Faculty, or Admin.",
                "If you choose <b>Student</b>, enter the <b>Roll number</b> field.",
                "If you choose <b>Faculty</b>, enter the <b>Employee ID</b> field.",
                "Click <b>Register</b> to create the account.",
                "After successful registration, the website redirects the user directly to the role dashboard.",
            ],
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("5. Login Flow", styles["SectionTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open the <b>Login</b> page.",
                "Select one of the role cards: <b>Admin</b>, <b>Faculty</b>, or <b>Student</b>.",
                "If the selected role is <b>Faculty</b>, choose the subtype: <b>HOD Login</b> or <b>Faculty Login</b>.",
                "Confirm that the email and password fields are filled. The page can auto-fill the demo credentials as hints.",
                "Click <b>Sign In</b>.",
                "The system redirects the user to the correct portal: student dashboard, faculty dashboard, HOD dashboard, or admin dashboard.",
            ],
        )
    )

    story.append(Paragraph("6. Student User Guide", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "Student users work mainly from the sidebar sections <b>Academic Path</b>, <b>Learning Lab</b>, <b>Campus Life</b>, and <b>Support Desk</b>.",
            styles["Body"],
        )
    )
    story.append(Paragraph("A. What a Student Can Do", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "See academic performance from the dashboard.",
                "Track attendance and view timetable details.",
                "Check results and fee status.",
                "Read notifications and upcoming exam information.",
                "Access placements, certificates, library, hostel, and transport modules when available.",
                "Upload documents, register face ID, submit complaints, and create service requests.",
            ],
        )
    )
    story.append(Paragraph("B. Student Dashboard", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "After login, review the dashboard cards for <b>Attendance</b>, <b>Current CGPA</b>, <b>Pending Fees</b>, and <b>Active Courses</b>.",
                "Use the quick action buttons to open <b>View Timetable</b>, <b>Check Results</b>, <b>Pay Fees</b>, or <b>Apply Placement</b>.",
                "Read recent notifications and upcoming exams.",
                "Check the attendance overview graph to monitor subject-wise attendance percentage.",
            ],
        )
    )
    story.append(Paragraph("C. Student Day-to-Day Tasks", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "<b>Profile</b>: View or update personal information.",
                "<b>Attendance</b>: Check attendance details and status by subject.",
                "<b>Timetable</b>: View the class schedule.",
                "<b>Results</b>: Open published examination results.",
                "<b>Fees</b>: Check dues and complete fee payment.",
                "<b>Notifications</b>: Read college notices and updates.",
                "<b>Placements</b>: Review drives and apply for eligible opportunities.",
                "<b>Library</b>: View issued books or library records.",
                "<b>Certificates</b>: View generated certificates and download them when available.",
                "<b>Hostel</b> and <b>Transport</b>: Access service-related details if assigned.",
            ],
        )
    )
    story.append(Paragraph("D. Student Support Desk Flow", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open <b>Face ID Register</b> to register facial identity if that feature is enabled.",
                "Open <b>Complaints</b> to submit a grievance.",
                "Open <b>Service Request</b> to submit a request for campus support.",
                "Use <b>Request Status</b> to track submitted requests.",
                "Use <b>Documents</b> to upload or manage student documents.",
            ],
        )
    )

    story.append(Paragraph("7. Faculty User Guide", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "Faculty users mainly operate from <b>Operations</b>, <b>Academic Flow</b>, and <b>Governance</b> sections in the sidebar.",
            styles["Body"],
        )
    )
    story.append(Paragraph("A. What a Faculty User Can Do", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "Monitor teaching-related information from the faculty dashboard.",
                "Mark attendance manually or with face attendance tools.",
                "Enter marks, upload results, and manage assignments.",
                "Upload study materials for students.",
                "View student lists, notifications, leave requests, and payslips.",
            ],
        )
    )
    story.append(Paragraph("B. Faculty Dashboard", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Sign in using a faculty account.",
                "Open the dashboard to review teaching-related data and shortcuts.",
                "Use the sidebar to switch quickly between attendance, marks, result upload, materials, and notifications.",
            ],
        )
    )
    story.append(Paragraph("C. Mark Attendance", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open <b>Mark Attendance</b> from the sidebar.",
                "Choose the assigned <b>Course</b> from the dropdown.",
                "Select the <b>Date</b>.",
                "Load the student list automatically for the selected course.",
                "Use <b>All present</b> or <b>All absent</b> for quick entry if needed.",
                "For each student, mark one status: <b>Present</b>, <b>Absent</b>, or <b>Late</b>.",
                "Click <b>Submit attendance</b> to save.",
                "Review the <b>Attendance report</b> section below the form to verify totals, sessions, and percentages.",
            ],
        )
    )
    story.append(Paragraph("D. Other Faculty Tasks", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "<b>Face Attendance</b>: Capture or manage face-based attendance workflows.",
                "<b>Enter Marks</b>: Enter marks for exams or internal assessments.",
                "<b>Assignments</b>: Create and manage assignment records.",
                "<b>Result Upload</b>: Upload result data for publication workflows.",
                "<b>Study Materials</b>: Upload or manage LMS / study content.",
                "<b>My Students</b>: View assigned student data.",
                "<b>Notifications</b>: Review institutional messages.",
                "<b>Leave Request</b>: Submit leave applications.",
                "<b>My Payslips</b>: Review payroll and salary records.",
            ],
        )
    )

    story.append(PageBreak())

    story.append(Paragraph("8. HOD User Guide", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "HOD users sign in through the faculty role but land in a department management portal. The HOD sidebar adds a dedicated <b>HOD Management</b> section.",
            styles["Body"],
        )
    )
    story.append(Paragraph("A. What an HOD Can Do", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "Monitor department-level operations from the HOD console.",
                "Review department faculty and department overview pages.",
                "Manage courses and department timetable information.",
                "Approve or reject leave requests.",
                "Review department notifications and academic coordination tasks.",
            ],
        )
    )
    story.append(
        numbered_steps(
            styles,
            [
                "On the login page, choose <b>Faculty</b> and then <b>HOD Login</b>.",
                "After sign-in, open the <b>HOD Console</b> dashboard.",
                "Use <b>Dept Faculty</b> to manage or review faculty members in the department.",
                "Use <b>Dept Overview</b> to check the department view of students and operations.",
                "Open <b>Courses</b> to manage course-related work.",
                "Open <b>Timetable</b> to manage department schedule details.",
                "Open <b>Leave Approvals</b> to approve or reject faculty leave requests.",
                "Use <b>Notifications</b> to review department communication.",
            ],
        )
    )

    story.append(Paragraph("9. Admin User Guide", styles["SectionTitle"]))
    story.append(
        Paragraph(
            "Admin users have the broadest menu. The sidebar groups work into <b>Core Insights</b>, <b>Academic Ops</b>, <b>Logistics & Estate</b>, and <b>Finance & Governance</b>.",
            styles["Body"],
        )
    )
    story.append(Paragraph("A. What an Admin Can Do", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "View institution-wide dashboard metrics and analytics.",
                "Create, update, filter, export, and remove master records such as students, faculty, departments, and courses.",
                "Control admissions, attendance, exams, results, fees, timetable, and notifications.",
                "Manage library, placements, hostel, transport, payroll, scholarship, event, certificate, and report modules.",
                "Perform approval and governance tasks across the system.",
            ],
        )
    )
    story.append(Paragraph("B. Admin Dashboard", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Sign in as Admin and open the dashboard.",
                "Review summary cards for <b>Total Students</b>, <b>Total Faculty</b>, <b>Departments</b>, <b>Courses</b>, <b>Pending Admissions</b>, and <b>Fee Collection</b>.",
                "Read the charts for admission trends, fee collection overview, department-wise students, and attendance by department.",
                "Use the quick actions panel to jump to <b>Add student</b>, <b>Add faculty</b>, <b>Create notice</b>, or <b>View reports</b>.",
            ],
        )
    )
    story.append(Paragraph("C. Student Management Workflow", styles["SubTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Open <b>Students</b> from the sidebar.",
                "Use the search field to find a student by roll number, name, or email.",
                "Use the filters for <b>Department</b>, <b>Semester</b>, and <b>Batch</b>.",
                "Click <b>Add student</b> to open the form.",
                "Fill in the required data such as roll number, full name, email, password, department, semester, and status.",
                "Optionally add personal information, address details, and guardian details.",
                "Click <b>Create student</b> to save the new record.",
                "To edit a student, open the row and click save after changes.",
                "To remove a student, use the delete action and confirm the dialog.",
                "Use <b>Excel</b> or <b>CSV</b> export to download the filtered list.",
            ],
        )
    )
    story.append(Paragraph("D. Admin Core Operations", styles["SubTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "<b>Faculty</b>: Add, edit, and manage faculty records.",
                "<b>Departments</b>: Maintain department master data.",
                "<b>Curriculum</b>: Manage courses and related academic structures.",
                "<b>Attendance</b>: Review institution attendance records.",
                "<b>Exams</b> and <b>Results</b>: Manage examinations and published outcomes.",
                "<b>Timetable</b> and <b>Result Upload</b>: Control scheduling and uploads.",
                "<b>Hostel</b>, <b>Transport</b>, <b>Library</b>, and <b>Placements</b>: Maintain operational service modules.",
                "<b>Fees</b> and <b>Payroll</b>: Handle finance-related records.",
                "<b>Admissions</b>: Review and process applications.",
                "<b>Notifications</b>: Publish notices to users.",
                "<b>Leave Approvals</b>: Manage approval workflow.",
                "<b>Reports</b>: View analytics and summaries.",
                "<b>Scholarship</b>, <b>Events</b>, and <b>Certificates</b>: Manage specialized modules.",
            ],
        )
    )

    story.append(Paragraph("10. Recommended End-to-End Usage Sequence", styles["SectionTitle"]))
    story.append(
        numbered_steps(
            styles,
            [
                "Start at the public website and review college information.",
                "Create an account from <b>Register</b> if the user does not already exist.",
                "Sign in through the role-based login page.",
                "Use the dashboard first to understand pending tasks and summary status.",
                "Use the sidebar to open the correct module for the next action.",
                "Complete data entry or review work and confirm that toast messages or updated tables show the save succeeded.",
                "Return to the dashboard or relevant reports page to verify the effect of the action.",
                "Sign out when finished so the next user starts with a clean session.",
            ],
        )
    )

    story.append(Paragraph("11. Troubleshooting Tips", styles["SectionTitle"]))
    story.append(
        bullet_list(
            styles,
            [
                "If login fails, check that the role selected on the login page matches the account type.",
                "If HOD login does not open the HOD portal, use the HOD sub-role option instead of regular faculty login.",
                "If data pages show placeholders or empty cards, verify that the backend API and database are running.",
                "If a table appears empty, try clearing filters or refreshing the page.",
                "If uploads do not work, confirm that the selected file matches the expected type, such as image uploads for student photos.",
                "If pages do not load after login, verify that the frontend and backend are connected and the seeded users exist.",
            ],
        )
    )

    story.append(Spacer(1, 0.15 * inch))
    story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#B7C9D6")))
    story.append(Spacer(1, 0.1 * inch))
    story.append(
        Paragraph(
            "This end user manual was generated from the current website routes, sidebar structure, login flow, and representative page behavior in the project source code.",
            styles["GuideSubtitle"],
        )
    )

    return story


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT_FILE),
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
        title="College Management System End User Manual",
        author="OpenAI Codex",
    )
    story = build_story()
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
