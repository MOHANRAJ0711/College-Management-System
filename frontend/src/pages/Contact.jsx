import { useState } from 'react';
import { FiClock, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    toast.success('Thanks! We will get back to you shortly.');
    setForm({ name: '', email: '', subject: '', message: '' });
  }

  return (
    <div className="bg-slate-50">
      <section className="border-b border-indigo-100 bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8 lg:py-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Contact us</h1>
          <p className="mt-4 text-lg text-indigo-100/95">
            Questions about admissions, programs, or campus life? We&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <FiMapPin className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Address</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                CampusOne College, Knowledge Park, Bengaluru — 560001, Karnataka, India
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <FiPhone className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Phone</h3>
              <p className="mt-2 text-sm text-slate-600">+91 80 4000 2100</p>
              <p className="text-sm text-slate-600">+91 80 4000 2101 (Admissions)</p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-200/50">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                <FiMail className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">Email</h3>
              <p className="mt-2 text-sm text-slate-600">hello@campusone.edu</p>
              <p className="text-sm text-slate-600">admissions@campusone.edu</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-6">
              <div className="flex items-center gap-2 text-indigo-900">
                <FiClock className="h-5 w-5" />
                <h3 className="font-semibold">Office hours</h3>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-indigo-900/80">
                <li>Mon–Fri: 9:00 AM – 5:30 PM</li>
                <li>Saturday: 9:00 AM – 1:00 PM</li>
                <li>Sunday &amp; public holidays: Closed</li>
              </ul>
            </div>
          </div>

          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-indigo-100/40"
            >
              <h2 className="text-2xl font-bold text-slate-900">Send a message</h2>
              <p className="mt-2 text-sm text-slate-600">
                Share a few details and our team will respond within two business days.
              </p>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                    placeholder="Your full name"
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
              <label className="mt-5 block text-sm font-medium text-slate-700">
                Subject
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                  placeholder="How can we help?"
                />
              </label>
              <label className="mt-5 block text-sm font-medium text-slate-700">
                Message
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none ring-indigo-500/0 transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/15"
                  placeholder="Tell us more..."
                />
              </label>
              <button
                type="submit"
                className="mt-8 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-400/30 transition hover:from-indigo-500 hover:to-blue-500 sm:w-auto sm:px-10"
              >
                Submit
              </button>
            </form>

            <div className="mt-8 overflow-hidden rounded-3xl border border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50">
              <div className="flex aspect-[21/9] min-h-[200px] items-center justify-center text-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                    Map placeholder
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Interactive map embed can be added here (Google Maps / OpenStreetMap).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
