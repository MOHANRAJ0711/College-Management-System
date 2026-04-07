import { useAnimatedCounter } from '../../hooks/useAnimatedCounter';

const colorStyles = {
  indigo:
    'from-indigo-500 to-indigo-700 text-white shadow-indigo-500/30',
  green: 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/30',
  blue: 'from-sky-500 to-blue-600 text-white shadow-sky-500/30',
  red: 'from-rose-500 to-red-600 text-white shadow-rose-500/30',
  yellow: 'from-amber-400 to-orange-500 text-white shadow-amber-500/30',
  purple: 'from-violet-500 to-purple-700 text-white shadow-violet-500/30',
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'indigo',
  animate = false,
}) {
  const numeric =
    typeof value === 'number' && !Number.isNaN(value) ? value : Number(value);
  const canAnimate = animate && Number.isFinite(numeric);
  const display = useAnimatedCounter(canAnimate ? numeric : 0, 1200);
  const shown = canAnimate ? display : value;

  const gradient = colorStyles[color] ?? colorStyles.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 shadow-lg transition hover:shadow-xl`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/85">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{shown}</p>
        </div>
        {Icon ? (
          <span className="rounded-xl bg-white/20 p-2.5 text-white backdrop-blur-sm">
            <Icon className="h-6 w-6" />
          </span>
        ) : null}
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
    </div>
  );
}
