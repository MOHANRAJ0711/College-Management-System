/**
 * timetableNotifier.js
 *
 * Cron job that runs every minute.
 * Detects timetable periods starting in exactly 10 minutes and creates
 * a personal in-app notification for the assigned faculty member.
 *
 * Duplicate-guard: uses a composite key stored in notification.meta.reminderKey
 * so the same period never triggers more than one alert per day.
 */

const cron = require('node-cron');
const Timetable = require('../models/Timetable');
const Notification = require('../models/Notification');
const Faculty = require('../models/Faculty');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse a 12-hour time string like "09:30 AM" or "02:10 PM"
 * and return { hours, minutes } in 24-hour format.
 */
function parseTime(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let hours = parseInt(m[1], 10);
  const minutes = parseInt(m[2], 10);
  const period = m[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return { hours, minutes };
}

/**
 * Return the current weekday name (e.g. "Monday") in IST.
 * We use UTC+5:30 offset to handle server timezone differences.
 */
function getCurrentDayIST() {
  const now = new Date();
  // IST = UTC + 5h30m
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[istDate.getUTCDay()];
}

/**
 * Return current time + 10 minutes in IST as { hours, minutes }.
 */
function getTargetTimeIST() {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + istOffset + 10 * 60 * 1000);
  return { hours: istDate.getUTCHours(), minutes: istDate.getUTCMinutes() };
}

/**
 * Build a short date string "YYYY-MM-DD" in IST for the duplicate guard key.
 */
function todayIST() {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 10); // "2026-04-10"
}

// ─── Core check function ─────────────────────────────────────────────────────

async function checkAndNotify() {
  try {
    const dayName = getCurrentDayIST();
    const target = getTargetTimeIST();
    const dateStr = todayIST();

    // Find all active timetable entries for today's weekday
    const entries = await Timetable.find({ day: dayName, isActive: true })
      .populate({
        path: 'periods.faculty',
        select: 'user',
        populate: { path: 'user', select: '_id name' },
      })
      .populate({ path: 'periods.course', select: 'name code' })
      .populate({ path: 'department', select: 'name' })
      .lean();

    const toInsert = [];

    for (const entry of entries) {
      for (const period of entry.periods || []) {
        // Skip if no faculty assigned
        if (!period.faculty?.user?._id) continue;

        const parsed = parseTime(period.startTime);
        if (!parsed) continue;

        // Check if this period starts in exactly 10 minutes
        if (parsed.hours !== target.hours || parsed.minutes !== target.minutes) continue;

        const facultyUserId = period.faculty.user._id.toString();
        const courseName = period.course?.name || 'Your class';
        const courseCode = period.course?.code ? ` (${period.course.code})` : '';
        const deptName = entry.department?.name || '';
        const roomInfo = period.room ? ` — Room ${period.room}` : '';
        const reminderKey = `timetable-${dateStr}-${period._id || period.periodNumber}-${facultyUserId}`;

        // Duplicate guard: skip if a notification with this key was already sent today
        const alreadySent = await Notification.findOne({ 'meta.reminderKey': reminderKey }).lean();
        if (alreadySent) continue;

        toInsert.push({
          title: '📚 Class Starting in 10 Minutes',
          message: `Your ${courseName}${courseCode} class (Sem ${entry.semester}, Sec ${entry.section || '—'}) starts at ${period.startTime}${roomInfo}. ${deptName ? `Department: ${deptName}.` : ''} Please head to the classroom.`,
          type: 'timetable',
          targetRole: 'faculty',
          recipient: facultyUserId,
          createdBy: facultyUserId, // system notification — self-created for simplicity
          isActive: true,
          expiryDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // expires in 2 hours
          meta: {
            reminderKey,
            timetableId: entry._id,
            periodNumber: period.periodNumber,
            courseId: period.course?._id,
            day: dayName,
            date: dateStr,
          },
        });
      }
    }

    if (toInsert.length > 0) {
      await Notification.insertMany(toInsert, { ordered: false });
      const names = toInsert.map((n) => n.meta.reminderKey.split('-').slice(-1)[0]);
      console.log(`[timetable-notifier] 🔔 Sent ${toInsert.length} class reminder(s) at ${new Date().toISOString()}`);
    }
  } catch (err) {
    console.error('[timetable-notifier] Error during check:', err.message);
  }
}

// ─── Start cron ──────────────────────────────────────────────────────────────

function startTimetableNotifier() {
  // Run every minute: "* * * * *"
  cron.schedule('* * * * *', checkAndNotify, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[timetable-notifier] ✅ Started — checking every minute for upcoming classes (IST)');
}

module.exports = { startTimetableNotifier, checkAndNotify };
