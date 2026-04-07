import { Link } from 'react-router-dom';
import {
  FiBook,
  FiBriefcase,
  FiGlobe,
  FiLayers,
  FiMail,
  FiPhone,
  FiUsers,
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

const features = [
  {
    title: 'Admissions',
    desc: 'Streamlined applications, merit lists, and onboarding in one place.',
    icon: FiLayers,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    title: 'Student Portal',
    desc: 'Attendance, results, fees, and schedules at your fingertips.',
    icon: HiOutlineAcademicCap,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Faculty Portal',
    desc: 'Teaching tools, assessments, and class insights built for educators.',
    icon: FiUsers,
    color: 'from-violet-500 to-indigo-500',
  },
  {
    title: 'Placements',
    desc: 'Career prep, drives, and recruiter connections that open doors.',
    icon: FiBriefcase,
    color: 'from-indigo-600 to-blue-600',
  },
  {
    title: 'Library',
    desc: 'Digital catalogs, issue tracking, and quiet study spaces.',
    icon: HiOutlineBuildingLibrary,
    color: 'from-sky-500 to-indigo-500',
  },
  {
    title: 'Global Outlook',
    desc: 'Exchange programs, research ties, and a diverse campus culture.',
    icon: FiGlobe,
    color: 'from-fuchsia-500 to-indigo-500',
  },
];

const testimonials = [
  {
    quote:
      'The faculty pushed me to think critically and the placement cell helped me land my dream internship.',
    name: 'Ananya Sharma',
    role: 'Computer Science, Class of 2024',
  },
  {
    quote:
      'World-class labs and mentorship. I published my first paper before graduation.',
    name: 'Rahul Verma',
    role: 'Electronics & Communication',
  },
  {
    quote:
      'Inclusive, vibrant, and rigorous — exactly the environment I needed to grow.',
    name: 'Meera Iyer',
    role: 'MBA, Operations',
  },
];

function StatCard({ label, value, suffix = '' }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center shadow-lg shadow-indigo-900/10 backdrop-blur-md">
      <p className="text-4xl font-bold tabular-nums text-white sm:text-5xl">
        {value}
        {suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-indigo-100">{label}</p>
    </div>
  );
}

export default function Home() {
  const students = useAnimatedCounter(12800);
  const faculty = useAnimatedCounter(420);
  const courses = useAnimatedCounter(96);
  const placements = useAnimatedCounter(92);

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="flex-1 space-y-8">
            <p className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-100">
              Excellence in education
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Shape your future at{' '}
              <span className="text-indigo-100">CampusOne College</span>
            </h1>
            <p className="max-w-xl text-lg text-indigo-100/95">
              A modern campus where innovation meets tradition — research-driven programs,
              industry-aligned curriculum, and mentors who invest in your journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-xl shadow-indigo-900/20 transition hover:-translate-y-0.5 hover:bg-indigo-50"
              >
                Apply Now
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Login
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-indigo-100/90">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                NAAC accredited programs
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                50+ industry partners
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div className="relative mx-auto max-w-md rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur-md">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 opacity-90 shadow-lg" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white">
                    🎓
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-100">Campus snapshot</p>
                    <p className="text-lg font-semibold text-white">Learning that scales with you</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-indigo-100/95">
                  From smart classrooms to maker spaces, every corner is designed for curiosity —
                  collaborate, prototype, and present ideas that matter.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-white/15 p-4">
                    <p className="text-2xl font-bold text-white">120+</p>
                    <p className="text-xs text-indigo-100">Labs & studios</p>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-4">
                    <p className="text-2xl font-bold text-white">24/7</p>
                    <p className="text-xs text-indigo-100">Learning resources</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Everything you need on one campus
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Purpose-built portals and services so students, faculty, and staff stay aligned.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ title, desc, icon, color }) => {
            const ItemIcon = icon;
            return (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/40"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}
                >
                  <ItemIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-indigo-100 bg-gradient-to-r from-indigo-600 to-blue-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">By the numbers</h2>
            <p className="mt-2 text-indigo-100">A thriving community focused on outcomes.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students enrolled" value={students.toLocaleString()} suffix="+" />
            <StatCard label="Faculty members" value={faculty} suffix="+" />
            <StatCard label="Courses & electives" value={courses} suffix="+" />
            <StatCard label="Placement rate" value={placements} suffix="%" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Voices from our community
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Stories from learners who grew here — and carried the torch forward.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-slate-200/50"
            >
              <blockquote className="flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 border-t border-slate-100 pt-4">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p className="text-sm text-indigo-600">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-100 bg-slate-900 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-lg font-semibold text-white">
                Campus<span className="text-indigo-400">One</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                Empowering learners with rigorous academics, humane values, and real-world skills.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">Explore</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/about" className="hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white">
                    Admissions
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">Account</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/login" className="hover:text-white">
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white">
                    Register
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-white">Contact</p>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <FiPhone className="mt-0.5 h-4 w-4 text-indigo-400" />
                  +91 80 4000 2100
                </li>
                <li className="flex items-start gap-2">
                  <FiMail className="mt-0.5 h-4 w-4 text-indigo-400" />
                  hello@campusone.edu
                </li>
                <li className="flex items-start gap-2">
                  <FiBook className="mt-0.5 h-4 w-4 text-indigo-400" />
                  Bengaluru, India
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} CampusOne College. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
