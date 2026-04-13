import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import DashboardLayout from './components/Layout/DashboardLayout';
import PublicLayout from './components/Layout/PublicLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const loadDashboard = (name) =>
  lazy(() =>
    import('./pages/dashboards/dashboardPages.jsx').then((m) => ({ default: m[name] }))
  );

// Student pages
const StudentDashboard = loadDashboard('StudentDashboard');
const StudentProfile = loadDashboard('StudentProfile');
const StudentAttendance = loadDashboard('StudentAttendance');
const StudentResults = loadDashboard('StudentResults');
const StudentFees = loadDashboard('StudentFees');
const StudentTimetable = loadDashboard('StudentTimetable');
const StudentNotifications = loadDashboard('StudentNotifications');
const StudentPlacements = loadDashboard('StudentPlacements');
const StudentLibrary = loadDashboard('StudentLibrary');
const StudentCertificates = loadDashboard('StudentCertificates');
const StudentHostel = lazy(() => import('./pages/student/StudentHostel.jsx'));
const StudentFaceRegister = lazy(() => import('./pages/student/FaceRegister.jsx'));
const StudentComplaints = lazy(() => import('./pages/student/Complaints.jsx'));
const StudentTransport = lazy(() => import('./pages/student/StudentTransport.jsx'));
const StudentMaterials = lazy(() => import('./pages/student/SubjectMaterials.jsx'));
const StudentFeedback = lazy(() => import('./pages/student/FacultyFeedback.jsx'));
const StudentDocUpload = lazy(() => import('./pages/student/DocumentUpload.jsx'));
const StudentServiceRequest = lazy(() => import('./pages/student/ServiceRequest.jsx'));
const StudentRequestStatus = lazy(() => import('./pages/student/RequestStatus.jsx'));
const StudentScholarship = lazy(() => import('./pages/student/ScholarshipPortal.jsx'));
const StudentEvents = lazy(() => import('./pages/student/CampusEvents.jsx'));

// Faculty pages
const FacultyDashboard = loadDashboard('FacultyDashboard');
const FacultyProfile = loadDashboard('FacultyProfile');
const FacultyAttendance = loadDashboard('FacultyAttendance');
const FacultyMarks = loadDashboard('FacultyMarks');
const FacultyTimetable = loadDashboard('FacultyTimetable');
const FacultyStudents = loadDashboard('FacultyStudents');
const FacultyNotifications = loadDashboard('FacultyNotifications');
const FacultyResultUpload = lazy(() => import('./pages/faculty/ResultUpload.jsx'));
const FacultyFaceAttendance = lazy(() => import('./pages/faculty/FaceAttendance.jsx'));
const FacultyAssignments = lazy(() => import('./pages/faculty/AssignmentManagement.jsx'));
const FacultyLeave = lazy(() => import('./pages/faculty/LeaveApplication.jsx'));
const FacultyPayslips = lazy(() => import('./pages/faculty/MyPayslips.jsx'));
const FacultyLMS = lazy(() => import('./pages/faculty/MaterialUpload.jsx'));

// HOD pages
const HODDashboard = lazy(() => import('./pages/hod/Dashboard.jsx'));
const HODFaculty = lazy(() => import('./pages/hod/FacultyManagement.jsx'));
const HODDepartment = lazy(() => import('./pages/hod/DepartmentOverview.jsx'));
const HODCourses = lazy(() => import('./pages/hod/CourseManagement.jsx'));
const HODTimetable = lazy(() => import('./pages/hod/TimetableManagement.jsx'));
const HODNotifications = lazy(() => import('./pages/hod/NotificationPanel.jsx'));
const HODLeaveApprovals = lazy(() => import('./pages/hod/LeaveApprovals.jsx'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const AdminStudents = lazy(() => import('./pages/admin/ManageStudents.jsx'));
const AdminFaculty = lazy(() => import('./pages/admin/ManageFaculty.jsx'));
const AdminDepartments = lazy(() => import('./pages/admin/ManageDepartments.jsx'));
const AdminCourses = lazy(() => import('./pages/admin/ManageCourses.jsx'));
const AdminAdmissions = lazy(() => import('./pages/admin/AdmissionControl.jsx'));
const AdminAttendance = lazy(() => import('./pages/admin/AttendanceManagement.jsx'));
const AdminExams = lazy(() => import('./pages/admin/ExamManagement.jsx'));
const AdminResults = lazy(() => import('./pages/admin/ResultManagement.jsx'));
const AdminFees = lazy(() => import('./pages/admin/FeeManagement.jsx'));
const AdminTimetable = lazy(() => import('./pages/admin/TimetableManagement.jsx'));
const AdminNotifications = lazy(() => import('./pages/admin/NotificationManagement.jsx'));
const AdminLibrary = lazy(() => import('./pages/admin/LibraryManagement.jsx'));
const AdminPlacements = lazy(() => import('./pages/admin/PlacementManagement.jsx'));
const AdminCertificates = lazy(() => import('./pages/admin/CertificateManagement.jsx'));
const AdminReports = lazy(() => import('./pages/admin/Reports.jsx'));
const AdminResultUpload = lazy(() => import('./pages/admin/ResultUpload.jsx'));
const AdminHostel = lazy(() => import('./pages/admin/HostelManagement.jsx'));
const AdminTransport = lazy(() => import('./pages/admin/TransportManagement.jsx'));
const AdminLeaveApprovals = lazy(() => import('./pages/hod/LeaveApprovals.jsx')); // Shared view
const AdminPayroll = lazy(() => import('./pages/admin/PayrollManagement.jsx'));
const AdminScholarship = lazy(() => import('./pages/admin/ScholarshipManagement.jsx'));
const AdminEvents = lazy(() => import('./pages/admin/EventApprovals.jsx'));

function DashboardFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingSpinner label="Loading…" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer position="top-right" theme="colored" />
      <Suspense fallback={<DashboardFallback />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Student */}
          <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="results" element={<StudentResults />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="timetable" element={<StudentTimetable />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="placements" element={<StudentPlacements />} />
            <Route path="library" element={<StudentLibrary />} />
            <Route path="certificates" element={<StudentCertificates />} />
            <Route path="hostel" element={<StudentHostel />} />
            <Route path="transport" element={<StudentTransport />} />
            <Route path="materials" element={<StudentMaterials />} />
            <Route path="feedback" element={<StudentFeedback />} />
            <Route path="face-register" element={<StudentFaceRegister />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="documents" element={<StudentDocUpload />} />
            <Route path="service-request" element={<StudentServiceRequest />} />
            <Route path="request-status" element={<StudentRequestStatus />} />
            <Route path="scholarship" element={<StudentScholarship />} />
            <Route path="events" element={<StudentEvents />} />
          </Route>

          {/* Faculty */}
          <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="profile" element={<FacultyProfile />} />
            <Route path="attendance" element={<FacultyAttendance />} />
            <Route path="marks" element={<FacultyMarks />} />
            <Route path="timetable" element={<FacultyTimetable />} />
            <Route path="students" element={<FacultyStudents />} />
            <Route path="notifications" element={<FacultyNotifications />} />
            <Route path="result-upload" element={<FacultyResultUpload />} />
            <Route path="face-attendance" element={<FacultyFaceAttendance />} />
            <Route path="assignments" element={<FacultyAssignments />} />
            <Route path="leave-request" element={<FacultyLeave />} />
            <Route path="my-payslips" element={<FacultyPayslips />} />
            <Route path="lms-upload" element={<FacultyLMS />} />
          </Route>

          {/* HOD */}
          <Route path="/hod" element={<ProtectedRoute allowedRoles={['faculty']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HODDashboard />} />
            <Route path="faculty" element={<HODFaculty />} />
            <Route path="students" element={<HODDepartment />} />
            <Route path="courses" element={<HODCourses />} />
            <Route path="timetable" element={<HODTimetable />} />
            <Route path="notifications" element={<HODNotifications />} />
            <Route path="leave-approvals" element={<HODLeaveApprovals />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="faculty" element={<AdminFaculty />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="admissions" element={<AdminAdmissions />} />
            <Route path="attendance" element={<AdminAttendance />} />
            <Route path="exams" element={<AdminExams />} />
            <Route path="results" element={<AdminResults />} />
            <Route path="fees" element={<AdminFees />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="library" element={<AdminLibrary />} />
            <Route path="placements" element={<AdminPlacements />} />
            <Route path="certificates" element={<AdminCertificates />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="hostel" element={<AdminHostel />} />
            <Route path="transport" element={<AdminTransport />} />
            <Route path="leave-approvals" element={<AdminLeaveApprovals />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="scholarship" element={<AdminScholarship />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="result-upload" element={<AdminResultUpload />} />
          </Route>

          <Route path="*" element={<><Navbar /><NotFound /></>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
