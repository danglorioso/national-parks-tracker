import { Flag, CalendarDays, Bookmark, Map } from "lucide-react";

interface QuickStatsProps {
  statesVisited: number;
  parksThisYear: number;
  bucketListCount: number;
  unvisitedCount: number;
  loading: boolean;
}

export default function QuickStats({
  statesVisited,
  parksThisYear,
  bucketListCount,
  unvisitedCount,
  loading,
}: QuickStatsProps) {
  const stats = [
    { label: "States", value: statesVisited, icon: Flag, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "This Year", value: parksThisYear, icon: CalendarDays, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Bucket List", value: bucketListCount, icon: Bookmark, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "To Go", value: unvisitedCount, icon: Map, color: "text-gray-500", bg: "bg-gray-100" },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Stats</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-lg p-3 flex items-center gap-2.5`}>
            <Icon className={`h-4 w-4 ${color} shrink-0`} />
            <div>
              <div className={`text-xl font-bold ${color} leading-none`}>
                {loading ? "—" : value}
              </div>
              <div className={`text-xs ${color} opacity-80 mt-0.5`}>{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
