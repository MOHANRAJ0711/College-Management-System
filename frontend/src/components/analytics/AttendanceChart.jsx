/**
 * A premium SVG-based bar chart for displaying attendance data.
 * @param {Object} props
 * @param {Array} props.data - Array of objects with { label, value }
 * @param {string} props.title - Chart title
 * @param {string} props.color - Base color for the bars
 */
export default function AttendanceChart({ data = [], title = 'Attendance Trends', color = 'indigo' }) {
  const chartData = data.length > 0 ? data : [
    { label: 'Dept A', value: 85 },
    { label: 'Dept B', value: 72 },
    { label: 'Dept C', value: 90 },
  ];

  const max = Math.max(100, Math.max(...chartData.map(d => d.value)));
  const colors = {
    indigo: 'from-indigo-600 to-blue-500',
    rose: 'from-rose-600 to-pink-500',
    emerald: 'from-emerald-600 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
  };

  const selectedColor = colors[color] || colors.indigo;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md h-full">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">Average attendance percentage by category</p>
      </div>

      <div className="flex h-48 items-end gap-3 sm:gap-4 px-2">
        {chartData.map((pt, i) => {
          const height = Math.round((pt.value / max) * 100);
          const isLow = pt.value < 75;
          
          return (
            <div key={`${pt.label}-${i}`} className="group relative flex flex-1 flex-col items-center gap-3">
              {/* Tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                {pt.label}: {pt.value.toFixed(1)}%
              </div>

              {/* Bar Container */}
              <div className="flex h-40 w-full items-end justify-center rounded-xl bg-slate-50/50 p-1">
                <div
                  className={`w-full max-w-[2.5rem] rounded-t-lg bg-gradient-to-t ${isLow ? 'from-amber-500 to-orange-400' : selectedColor} shadow-inner transition-all duration-500 hover:brightness-110`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
              </div>

              {/* Label */}
              <span className="max-w-full truncate text-center text-[10px] font-semibold text-slate-600 uppercase tracking-tighter">
                {pt.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="text-[10px] font-medium text-slate-500">Above 75%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-[10px] font-medium text-slate-500">Below 75%</span>
        </div>
      </div>
    </div>
  );
}
