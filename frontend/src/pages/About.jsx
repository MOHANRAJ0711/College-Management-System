import { FiAward, FiHeart, FiTarget } from 'react-icons/fi';
import { HiOutlineSparkles } from 'react-icons/hi2';

const pillars = [
  {
    title: 'Mission',
    body: 'Deliver transformative education that blends disciplinary depth with ethical leadership and lifelong curiosity.',
    icon: FiTarget,
    gradient: 'from-indigo-600 to-blue-600',
  },
  {
    title: 'Vision',
    body: 'To be a nationally recognized institution where research, industry, and community converge for public good.',
    icon: HiOutlineSparkles,
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    title: 'Values',
    body: 'Integrity, inclusion, innovation — we celebrate diverse voices and build trust through transparency.',
    icon: FiHeart,
    gradient: 'from-violet-600 to-indigo-600',
  },
];

const highlights = [
  'Strong industry partnerships and live projects every semester',
  'Mentorship from faculty active in research and consulting',
  'Scholarships and support for meritorious and need-based students',
  'Vibrant clubs, national-level events, and sports infrastructure',
];

export default function About() {
  return (
    <div className="bg-slate-50">
      <section className="relative overflow-hidden border-b border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_55%)]" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">About us</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            A legacy of learning, a future built together
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-100/95">
            Founded with a belief that education must evolve with the world, CampusOne has grown into a
            collaborative hub for students, researchers, and industry leaders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-indigo-100/40 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <FiAward className="h-4 w-4" />
              Our story
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">College history</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Established over three decades ago as a small technical institute, CampusOne expanded into a
            multidisciplinary college with programs spanning engineering, management, and applied sciences.
            Our alumni lead teams across global enterprises, startups, and public institutions — carrying
            forward a culture of rigor and empathy.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Today, the campus blends heritage architecture with modern labs, smart classrooms, and
            collaborative studios. We continue to invest in faculty development, research infrastructure,
            and student well-being so every learner can thrive.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
        <h2 className="text-center text-3xl font-bold text-slate-900">Mission, vision & values</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          The principles that guide our classrooms, research, and community impact.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map(({ title, body, icon, gradient }) => {
            const ItemIcon = icon;
            return (
              <div
                key={title}
                className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-md shadow-slate-200/50"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                >
                  <ItemIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-y border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 py-14 lg:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Key highlights</h2>
              <p className="mt-3 text-slate-600">
                What sets the CampusOne experience apart — inside and outside the classroom.
              </p>
              <ul className="mt-8 space-y-4">
                {highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-xl border border-indigo-100/80 bg-white/80 px-4 py-3 text-slate-700 shadow-sm"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-xl shadow-indigo-100/50">
              <h3 className="text-xl font-semibold text-slate-900">Campus information</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Spread across 60 acres of green cover, the campus offers hostels, cafeterias, sports
                arenas, innovation garages, and wellness centers. Shuttle services connect academic blocks
                with residential quarters, keeping the community connected and safe.
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-indigo-50/80 p-4">
                  <dt className="font-medium text-indigo-900">Location</dt>
                  <dd className="mt-1 text-slate-600">Bengaluru, Karnataka</dd>
                </div>
                <div className="rounded-xl bg-blue-50/80 p-4">
                  <dt className="font-medium text-blue-900">Campus size</dt>
                  <dd className="mt-1 text-slate-600">~60 acres</dd>
                </div>
                <div className="rounded-xl bg-indigo-50/80 p-4">
                  <dt className="font-medium text-indigo-900">Hostels</dt>
                  <dd className="mt-1 text-slate-600">Separate towers for UG & PG</dd>
                </div>
                <div className="rounded-xl bg-blue-50/80 p-4">
                  <dt className="font-medium text-blue-900">Transit</dt>
                  <dd className="mt-1 text-slate-600">City bus & metro links</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
