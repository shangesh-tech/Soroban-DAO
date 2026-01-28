export default function StatsCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:border-neutral-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-black">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-400">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-neutral-100 rounded-lg">
          <Icon className="w-6 h-6 text-black" />
        </div>
      </div>
    </div>
  );
}
