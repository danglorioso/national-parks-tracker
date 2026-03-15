"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import VisitDateDialog from "@/components/VisitDateDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Bookmark,
  Trash2,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  ChevronLeft,
  Clock,
  DollarSign,
  CloudSun,
  Tag,
  Mountain,
  CalendarDays,
} from "lucide-react";

/* ─── NPS API Types ──────────────────────────────────────────────────────── */

interface NPSImage {
  url: string;
  title: string;
  altText: string;
  caption: string;
  credit: string;
}

interface NPSActivity {
  id: string;
  name: string;
}

interface NPSTopic {
  id: string;
  name: string;
}

interface NPSAddress {
  type: string;
  line1: string;
  city: string;
  stateCode: string;
  postalCode: string;
}

interface NPSContact {
  phoneNumbers: Array<{ phoneNumber: string; type: string; description: string }>;
  emailAddresses: Array<{ emailAddress: string; description: string }>;
}

interface NPSFee {
  cost: string;
  title: string;
  description: string;
}

interface NPSHours {
  name: string;
  description: string;
  standardHours: Record<string, string>;
  exceptions: Array<{
    name: string;
    startDate: string;
    endDate: string;
    exceptionHours: Record<string, string>;
  }>;
}

interface NPSPark {
  id: string;
  url: string;
  fullName: string;
  parkCode: string;
  description: string;
  latitude: string;
  longitude: string;
  activities: NPSActivity[];
  topics: NPSTopic[];
  states: string;
  contacts: NPSContact;
  entranceFees: NPSFee[];
  entrancePasses: NPSFee[];
  directionsInfo: string;
  directionsUrl: string;
  operatingHours: NPSHours[];
  addresses: NPSAddress[];
  images: NPSImage[];
  weatherInfo: string;
  name: string;
  designation: string;
}

type VisitStatus = "visited" | "bucketList" | "notVisited";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ParkPage({
  params,
}: {
  params: Promise<{ parkCode: string }>;
}) {
  const { parkCode } = use(params);
  const { isSignedIn } = useUser();

  const [park, setPark] = useState<NPSPark | null>(null);
  const [parkLoading, setParkLoading] = useState(true);
  const [parkError, setParkError] = useState(false);

  const [visitStatus, setVisitStatus] = useState<VisitStatus>("notVisited");
  const [visitedDate, setVisitedDate] = useState<string | null>(null);
  const [visitLoading, setVisitLoading] = useState(true);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);

  const [showVisitDateDialog, setShowVisitDateDialog] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetchPark();
  }, [parkCode]);

  useEffect(() => {
    if (isSignedIn) {
      fetchVisitStatus();
    } else {
      setVisitLoading(false);
    }
  }, [isSignedIn, parkCode]);

  const fetchPark = async () => {
    try {
      const res = await fetch(`/api/parks/${parkCode}`);
      if (!res.ok) throw new Error("Not found");
      const data: NPSPark = await res.json();
      setPark(data);
    } catch {
      setParkError(true);
    } finally {
      setParkLoading(false);
    }
  };

  const fetchVisitStatus = async () => {
    try {
      const [visitsRes, parksRes] = await Promise.all([
        fetch("/api/visits"),
        fetch("/api/parks"),
      ]);
      if (visitsRes.ok) {
        const visits: Array<{
          park_code: string;
          is_bucket_list: boolean;
          visited_date: string | null;
        }> = await visitsRes.json();
        const match = visits.find((v) => v.park_code === parkCode);
        if (match) {
          if (match.is_bucket_list) {
            setVisitStatus("bucketList");
          } else {
            setVisitStatus("visited");
            setVisitedDate(match.visited_date);
          }
        }
        setVisitedParksCount(
          visits.filter((v) => !v.is_bucket_list && v.visited_date).length
        );
      }
      if (parksRes.ok) {
        const allParks: unknown[] = await parksRes.json();
        setTotalParksCount(allParks.length);
      }
    } finally {
      setVisitLoading(false);
    }
  };

  const handleMarkVisited = () => setShowVisitDateDialog(true);

  const handleConfirmVisitDate = async (date: Date) => {
    const wasVisited = visitStatus === "visited";
    const wasBucketList = visitStatus === "bucketList";
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          park_code: parkCode,
          is_bucket_list: false,
          visited_date: date.toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setVisitStatus("visited");
      setVisitedDate(date.toISOString());
      if (!wasVisited) {
        setVisitedParksCount((p) => p + 1);
        if (wasBucketList) {
          // no change to visitedParksCount for bucket list
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToBucketList = async () => {
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ park_code: parkCode, is_bucket_list: true }),
      });
      if (!res.ok) throw new Error("Failed");
      setVisitStatus("bucketList");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = async () => {
    try {
      const res = await fetch(`/api/visits?park_code=${parkCode}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      if (visitStatus === "visited") setVisitedParksCount((p) => Math.max(0, p - 1));
      setVisitStatus("notVisited");
      setVisitedDate(null);
    } catch (e) {
      console.error(e);
    }
  };

  /* ─── Render ─────────────────────────────────────────────────────────── */

  if (parkLoading) return <LoadingSkeleton />;
  if (parkError || !park) return <NotFound />;

  const heroImage = park.images?.[activeImage];
  const physicalAddress = park.addresses?.find((a) => a.type === "Physical") ?? park.addresses?.[0];
  const phone = park.contacts?.phoneNumbers?.find((p) => p.type === "Voice") ?? park.contacts?.phoneNumbers?.[0];
  const email = park.contacts?.emailAddresses?.[0];
  const stateNames = park.states
    ? park.states.split(",").map((s) => s.trim()).join(", ")
    : "";

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavBar
        visitedParksCount={visitedParksCount}
        totalParksCount={totalParksCount}
      />

      {/* Hero */}
      <div className="relative w-full h-72 sm:h-96 bg-gray-900 overflow-hidden">
        {heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage.url}
              alt={heroImage.altText}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${heroLoaded ? "opacity-60" : "opacity-0"}`}
              onLoad={() => setHeroLoaded(true)}
            />
            {!heroLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-4">
          <Link
            href="/visits"
            className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            My Visits
          </Link>
        </div>

        {/* Park name */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-emerald-400 text-sm font-medium uppercase tracking-wider mb-1">
              {park.designation}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              {park.fullName}
            </h1>
            {stateNames && (
              <div className="flex items-center gap-1.5 mt-2 text-white/70 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {stateNames}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image strip */}
      {park.images?.length > 1 && (
        <div className="bg-gray-900 px-4 sm:px-8 pb-3">
          <div className="max-w-5xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide">
            {park.images.slice(0, 8).map((img, i) => (
              <button
                key={i}
                onClick={() => { setActiveImage(i); setHeroLoaded(false); }}
                className={`shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                  activeImage === i ? "border-emerald-400" : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Main Column ── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <Section title="About" icon={<Mountain className="h-4 w-4" />}>
            <p className="text-gray-700 leading-relaxed">{park.description}</p>
            {park.url && (
              <a
                href={park.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Official NPS page <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </Section>

          {/* Activities */}
          {park.activities?.length > 0 && (
            <Section title="Activities" icon={<Tag className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {park.activities.map((a) => (
                  <span
                    key={a.id}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full border border-emerald-200"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Topics */}
          {park.topics?.length > 0 && (
            <Section title="Topics" icon={<Tag className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-2">
                {park.topics.map((t) => (
                  <span
                    key={t.id}
                    className="px-3 py-1 bg-sky-50 text-sky-700 text-sm rounded-full border border-sky-200"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {/* Weather */}
          {park.weatherInfo && (
            <Section title="Weather" icon={<CloudSun className="h-4 w-4" />}>
              <p className="text-gray-700 leading-relaxed">{park.weatherInfo}</p>
            </Section>
          )}

          {/* Directions */}
          {park.directionsInfo && (
            <Section title="Getting There" icon={<MapPin className="h-4 w-4" />}>
              <p className="text-gray-700 leading-relaxed">{park.directionsInfo}</p>
              {park.directionsUrl && (
                <a
                  href={park.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Get directions <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </Section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5">

          {/* Visit Status Card */}
          {isSignedIn && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
                Your Status
              </h3>

              {visitLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ) : visitStatus === "visited" ? (
                <>
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    Visited
                  </div>
                  {visitedDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {new Date(visitedDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemove}
                    className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remove Visit
                  </Button>
                </>
              ) : visitStatus === "bucketList" ? (
                <>
                  <div className="flex items-center gap-2 text-amber-500 font-medium text-sm">
                    <Bookmark className="h-4 w-4" />
                    On Bucket List
                  </div>
                  <Button
                    size="sm"
                    onClick={handleMarkVisited}
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Mark as Visited
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRemove}
                    className="w-full text-xs text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Remove from List
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleMarkVisited}
                    className="w-full text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Mark as Visited
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAddToBucketList}
                    className="w-full text-xs border-amber-300 text-amber-600 hover:bg-amber-50"
                  >
                    <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                    Add to Bucket List
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Entrance Fees */}
          {park.entranceFees?.length > 0 && (
            <SideCard title="Entrance Fees" icon={<DollarSign className="h-4 w-4" />}>
              <div className="space-y-3">
                {park.entranceFees.map((fee, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-800">{fee.title}</span>
                      <span className="text-sm font-bold text-emerald-600 shrink-0">
                        ${parseFloat(fee.cost).toFixed(0)}
                      </span>
                    </div>
                    {fee.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{fee.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </SideCard>
          )}

          {/* Operating Hours */}
          {park.operatingHours?.length > 0 && (
            <SideCard title="Hours" icon={<Clock className="h-4 w-4" />}>
              <div className="space-y-1">
                {DAYS.map((day) => {
                  const hours = park.operatingHours[0]?.standardHours?.[day];
                  if (!hours) return null;
                  return (
                    <div key={day} className="flex justify-between text-xs">
                      <span className="capitalize text-gray-500">{day.slice(0, 3)}</span>
                      <span className="text-gray-800 font-medium">{hours}</span>
                    </div>
                  );
                })}
              </div>
              {park.operatingHours[0]?.description && (
                <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                  {park.operatingHours[0].description}
                </p>
              )}
            </SideCard>
          )}

          {/* Contact */}
          {(phone || email || physicalAddress) && (
            <SideCard title="Contact" icon={<Phone className="h-4 w-4" />}>
              <div className="space-y-2">
                {physicalAddress && (
                  <div className="flex gap-2 text-xs text-gray-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                    <span>
                      {physicalAddress.line1}, {physicalAddress.city},{" "}
                      {physicalAddress.stateCode} {physicalAddress.postalCode}
                    </span>
                  </div>
                )}
                {phone && (
                  <div className="flex gap-2 text-xs text-gray-600">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <a href={`tel:${phone.phoneNumber}`} className="hover:text-emerald-600 transition-colors">
                      {phone.phoneNumber}
                    </a>
                  </div>
                )}
                {email && (
                  <div className="flex gap-2 text-xs text-gray-600 break-all">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <a href={`mailto:${email.emailAddress}`} className="hover:text-emerald-600 transition-colors">
                      {email.emailAddress}
                    </a>
                  </div>
                )}
              </div>
            </SideCard>
          )}
        </div>
      </div>

      {/* Image caption */}
      {heroImage?.caption && (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 pb-8">
          <p className="text-xs text-gray-400 italic">
            Photo: {heroImage.caption}{heroImage.credit ? ` — ${heroImage.credit}` : ""}
          </p>
        </div>
      )}

      <VisitDateDialog
        open={showVisitDateDialog}
        onOpenChange={setShowVisitDateDialog}
        parkName={park.fullName}
        onConfirm={handleConfirmVisitDate}
      />
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <h2 className="font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SideCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="h-16 bg-white border-b border-gray-200" />
      <Skeleton className="w-full h-80" />
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <Mountain className="h-12 w-12 text-gray-300" />
      <p className="text-lg font-semibold text-gray-600">Park not found</p>
      <p className="text-sm text-gray-400">We couldn&apos;t load data for this park.</p>
      <Link href="/visits">
        <Button variant="outline" size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to My Visits
        </Button>
      </Link>
    </div>
  );
}
