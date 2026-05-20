import { Skeleton } from "@/components/ui/skeleton"

interface ProgressCardProps {
  visitedCount: number
  totalCount: number
  loading: boolean
}

export default function ProgressCard({
  visitedCount,
  totalCount,
  loading,
}: ProgressCardProps) {
  const percentage =
    totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0

  return (
    <div className="bg-gradient-to-br from-emerald-700 to-emerald-600 border border-gray-300 rounded-xl p-6 text-white">
      {/* Header (static, no skeleton needed) */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold">Your Progress</h2>
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </div>

      {/* Counts */}
      <div className="mb-2">
        {loading ? (
          <Skeleton className="bg-green-200/40 h-10 w-32 rounded-md" />
        ) : (
          <div className="text-4xl font-bold">
            {visitedCount} / {totalCount}
          </div>
        )}
      </div>

      {/* Percentage */}
      <div className="mb-4">
        {loading ? (
          <Skeleton className="bg-green-200/40 h-5 w-28 rounded-md" />
        ) : (
          <div className="text-emerald-100 text-sm">
            {percentage}% Complete
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-emerald-100 bg-opacity-30 rounded-full h-4 overflow-hidden">
        <div
            className="bg-emerald-600 border border-white border-2 rounded-full h-4 transition-all"
            style={{ width: `${percentage}%` }}
          />
      </div>
    </div>
  )
}
