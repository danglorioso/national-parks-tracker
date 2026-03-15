"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, ChevronRight } from "lucide-react";

interface Park {
  park_code: string;
  name: string;
  description: string | null;
}

export default function ParksPage() {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/parks")
      .then((r) => r.json())
      .then((data: Park[]) => {
        setParks(data.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = parks.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          National Parks
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Browse all {loading ? "…" : parks.length} US national parks and
          explore each one.
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
          <Input
            placeholder="Search parks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-gray-100">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-64 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-16 text-center text-gray-400 text-sm">
              No parks match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filtered.map((park) => (
                <Link
                  key={park.park_code}
                  href={`/parks/${park.park_code}`}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors group"
                >
                  <MapPin className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                  <span className="flex-1 text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                    {park.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {filtered.length} of {parks.length} parks
          </p>
        )}
      </div>
    </div>
  );
}
