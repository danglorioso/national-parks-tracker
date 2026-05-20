export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className || ""}`.trim()}
      aria-busy="true"
      aria-label="Loading..."
    />
  );
}
