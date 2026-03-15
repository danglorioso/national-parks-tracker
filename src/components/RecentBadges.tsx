import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface RecentVisit {
  park_code: string;
  name: string;
  visitedDate: string;
}

interface RecentVisitsProps {
  visits: RecentVisit[];
  loading: boolean;
}

export default function RecentVisits({ visits, loading }: RecentVisitsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Recent Visits</h3>
        <Link href="/visits" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
          See all
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : visits.length === 0 ? (
        <p className="text-xs text-gray-400 py-3">
          No visits yet. Start exploring!
        </p>
      ) : (
        <div className="space-y-1.5">
          {visits.map((v) => (
            <Link
              key={v.park_code}
              href={`/parks/${v.park_code}`}
              className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700 transition-colors">
                  {v.name}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(v.visitedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-400 shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
