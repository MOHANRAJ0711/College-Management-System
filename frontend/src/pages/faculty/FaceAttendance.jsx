import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiCalendar,
  FiCamera,
  FiCheck,
  FiCheckCircle,
  FiImage,
  FiRefreshCw,
  FiSave,
  FiUpload,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import api from '../../services/api';
import { loadModels, detectAllFaces, matchFaces, drawDetections } from '../../utils/faceApi';

const STEP = { SELECT: 0, UPLOAD: 1, PROCESSING: 2, RESULTS: 3, SAVED: 4 };

function unwrapList(res) {
  const d = res?.data?.data ?? res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.students)) return d.students;
  return [];
}



export default function FaceAttendance() {
  const [step, setStep] = useState(STEP.SELECT);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [courseId, setCourseId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [classStudents, setClassStudents] = useState([]);
  const [preview, setPreview] = useState(null);
  const [matchResults, setMatchResults] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [webcamActive, setWebcamActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    api
      .get('/departments')
      .then(({ data }) => setDepartments(unwrapList({ data })))
      .catch(() => {});
    api
      .get('/courses')
      .then(({ data }) => setCourses(unwrapList({ data })))
      .catch(() => {});
  }, []);

  const filteredCourses = useMemo(() => {
    let list = courses;
    if (deptId) {
      list = list.filter((c) => {
        const cd = c.department;
        const cdId = typeof cd === 'object' ? cd?._id : cd;
        return cdId === deptId;
      });
    }
    if (semester) {
      list = list.filter((c) => String(c.semester) === semester);
    }
    return list;
  }, [courses, deptId, semester]);

  const fetchClassStudents = useCallback(async () => {
    if (!deptId) {
      toast.error('Please select a department');
      return;
    }
    try {
      const params = { department: deptId };
      if (semester) params.semester = semester;
      if (section) params.section = section;
      const { data } = await api.get('/face-attendance/class-descriptors', { params });
      const students = data.students ?? [];
      setClassStudents(students);

      const registeredCount = students.filter((s) => s.registered).length;
      if (registeredCount === 0) {
        toast.warn('No students in this class have registered their face yet');
      } else {
        toast.success(`Found ${students.length} students (${registeredCount} faces registered)`);
      }

      const map = {};
      students.forEach((s) => {
        map[s.studentId] = 'absent';
      });
      setAttendanceMap(map);
      setStep(STEP.UPLOAD);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to fetch class data');
    }
  }, [deptId, semester, section]);

  const initModels = async () => {
    if (modelsReady) return;
    toast.info('Loading AI face detection models...', { autoClose: 2000 });
    await loadModels();
    setModelsReady(true);
  };

  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: 'environment' }, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        },
      });
      streamRef.current = stream;
      setWebcamActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera');
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setPreview(URL.createObjectURL(blob));
      stopWebcam();
    }, 'image/jpeg', 0.92);
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setWebcamActive(false);
  };

  useEffect(() => {
    if (webcamActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [webcamActive]);

  useEffect(() => () => stopWebcam(), []);

  const processImage = async () => {
    if (!imgRef.current) return;
    setProcessing(true);
    setStep(STEP.PROCESSING);

    try {
      await initModels();

      const detections = await detectAllFaces(imgRef.current);
      if (detections.length === 0) {
        toast.error('No faces detected in the image. Try a clearer photo.');
        setStep(STEP.UPLOAD);
        setProcessing(false);
        return;
      }

      const knownFaces = classStudents.filter((s) => s.registered && s.descriptor);
      const results = matchFaces(detections, knownFaces);
      setMatchResults(results);

      const newMap = { ...attendanceMap };
      Object.keys(newMap).forEach((k) => (newMap[k] = 'absent'));
      results.forEach((r) => {
        if (r.matched && r.studentInfo?.id) {
          newMap[r.studentInfo.id] = 'present';
        }
      });
      setAttendanceMap(newMap);

      drawDetections(canvasRef.current, imgRef.current, results);

      const matchedCount = results.filter((r) => r.matched).length;
      toast.success(
        `Detected ${detections.length} face(s), matched ${matchedCount} student(s)`
      );
      setStep(STEP.RESULTS);
    } catch (err) {
      toast.error('Face processing failed: ' + (err.message || 'Unknown'));
      setStep(STEP.UPLOAD);
    } finally {
      setProcessing(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = 'present'));
      return next;
    });
  };

  const markAllAbsent = () => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => (next[k] = 'absent'));
      return next;
    });
  };

  const saveAttendance = async () => {
    if (!courseId) {
      toast.error('Please select a course/subject');
      return;
    }
    setSaving(true);
    try {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      const { data } = await api.post('/face-attendance/save-attendance', {
        courseId,
        date,
        semester: semester ? Number(semester) : undefined,
        records,
      });
      toast.success(
        `Attendance saved! Present: ${data.summary.present}, Absent: ${data.summary.absent}`
      );
      setStep(STEP.SAVED);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setStep(STEP.SELECT);
    setPreview(null);
    setMatchResults([]);
    setAttendanceMap({});
    setClassStudents([]);
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const registeredCount = classStudents.filter((s) => s.registered).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Face Recognition Attendance
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Upload a group photo to automatically detect and mark student attendance
        </p>
      </header>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['Select Class', 'Upload Photo', 'Processing', 'Review & Save'].map((label, i) => {
          const active = step >= i;
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-6 ${active ? 'bg-indigo-400' : 'bg-slate-200'}`}
                />
              )}
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  active
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-white'
                  }`}
                >
                  {step > i ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 0: Select class */}
      {step === STEP.SELECT && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <FiUsers className="h-5 w-5 text-indigo-600" />
            Select Class
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Department *
              </span>
              <select
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">Select</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Semester
              </span>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={String(s)}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Section
              </span>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. A"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </span>
              <div className="relative">
                <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
                />
              </div>
            </label>
          </div>
          <div className="mt-4">
            <label>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Course / Subject *
              </span>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="">Select course</option>
                {filteredCourses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={fetchClassStudents}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <FiUsers className="h-4 w-4" />
            Load Class
          </button>
        </div>
      )}

      {/* Step 1: Upload photo */}
      {step === STEP.UPLOAD && !preview && !webcamActive && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            <span>
              <strong>{classStudents.length}</strong> students loaded ·{' '}
              <strong>{registeredCount}</strong> faces registered
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Change class
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 transition hover:border-indigo-300 hover:bg-indigo-50/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <FiImage className="h-7 w-7" />
              </div>
              <p className="font-semibold text-slate-900">Upload Group Photo</p>
              <p className="text-center text-xs text-slate-500">
                Upload a classroom photo with student faces visible
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
            <button
              type="button"
              onClick={startWebcam}
              className="group flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 transition hover:border-indigo-300 hover:bg-indigo-50/30"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                <FiCamera className="h-7 w-7" />
              </div>
              <p className="font-semibold text-slate-900">Capture Live</p>
              <p className="text-center text-xs text-slate-500">
                Take a photo of the classroom using camera
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Webcam */}
      {webcamActive && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full rounded-xl bg-black"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={captureFromWebcam}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              <FiCamera className="mr-2 inline h-4 w-4" />
              Capture
            </button>
            <button
              type="button"
              onClick={stopWebcam}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Image preview + Process */}
      {preview && step < STEP.RESULTS && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="relative">
            <img
              ref={imgRef}
              src={preview}
              alt="Classroom"
              className="w-full rounded-xl"
              crossOrigin="anonymous"
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute left-0 top-0 h-full w-full"
            />
          </div>
          {step === STEP.PROCESSING && (
            <div className="flex flex-col items-center gap-2 py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm font-medium text-indigo-800">
                Detecting and matching faces...
              </p>
              <p className="text-xs text-slate-500">
                This may take 10-30 seconds depending on image size
              </p>
            </div>
          )}
          {step === STEP.UPLOAD && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={processImage}
                disabled={processing}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                <FiUpload className="mr-2 inline h-4 w-4" />
                Analyze Faces
              </button>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Choose Different Photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Results */}
      {step >= STEP.RESULTS && step < STEP.SAVED && (
        <div className="space-y-4">
          {/* Image with detections */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative">
              <img
                ref={imgRef}
                src={preview}
                alt="Detected faces"
                className="w-full rounded-xl"
                crossOrigin="anonymous"
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute left-0 top-0 h-full w-full"
              />
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 p-4 text-white shadow">
              <p className="text-xs font-medium text-white/80">Total Students</p>
              <p className="mt-1 text-2xl font-bold">{classStudents.length}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-4 text-white shadow">
              <p className="text-xs font-medium text-white/80">Present</p>
              <p className="mt-1 text-2xl font-bold">{presentCount}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-500 to-red-600 p-4 text-white shadow">
              <p className="text-xs font-medium text-white/80">Absent</p>
              <p className="mt-1 text-2xl font-bold">{absentCount}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-4 text-white shadow">
              <p className="text-xs font-medium text-white/80">Faces Detected</p>
              <p className="mt-1 text-2xl font-bold">{matchResults.length}</p>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={markAllPresent}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              <FiCheck className="h-3.5 w-3.5" />
              Mark All Present
            </button>
            <button
              type="button"
              onClick={markAllAbsent}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
            >
              <FiX className="h-3.5 w-3.5" />
              Mark All Absent
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setStep(STEP.UPLOAD);
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FiRefreshCw className="h-3.5 w-3.5" />
              Re-scan
            </button>
          </div>

          {/* Student attendance list */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-blue-50/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Roll No.</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Name</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Face Registered</th>
                  <th className="px-4 py-3 font-semibold text-indigo-950">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-indigo-950">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((s) => {
                  const status = attendanceMap[s.studentId] ?? 'absent';
                  const isPresent = status === 'present';
                  return (
                    <tr
                      key={s.studentId}
                      className={`transition ${
                        isPresent
                          ? 'bg-emerald-50/50 hover:bg-emerald-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs">{s.rollNumber}</td>
                      <td className="px-4 py-3 font-medium">{s.name}</td>
                      <td className="px-4 py-3">
                        {s.registered ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            <FiCheckCircle className="h-3 w-3" /> Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                            <FiX className="h-3 w-3" /> No
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 ring-emerald-600/10'
                              : 'bg-rose-100 text-rose-800 ring-rose-600/10'
                          }`}
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => toggleAttendance(s.studentId)}
                          className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                            isPresent
                              ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {isPresent ? 'Mark Absent' : 'Mark Present'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Save button */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-600">
              <strong>{presentCount}</strong> present · <strong>{absentCount}</strong> absent ·{' '}
              Date: <strong>{date}</strong>
            </p>
            <button
              type="button"
              onClick={saveAttendance}
              disabled={saving || !courseId}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  Save Attendance
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Saved */}
      {step === STEP.SAVED && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <FiCheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-emerald-900">Attendance Saved Successfully!</h2>
          <p className="text-sm text-emerald-700">
            {presentCount} present · {absentCount} absent · Date: {date}
          </p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <FiRefreshCw className="h-4 w-4" />
            Take Another Attendance
          </button>
        </div>
      )}
    </div>
  );
}
