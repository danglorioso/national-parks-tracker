"use client";

import { useUser } from "@clerk/nextjs";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MapHomePage from "@/components/MapHomePage";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Nav from "@/components/NavBar";
import ProgressCard from "@/components/ProgressCard";
import QuickStats from "@/components/QuickStats";
import RecentBadges from "@/components/RecentBadges";
import Legend from "@/components/Legend";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If signed in, show dashboard
  if (isSignedIn) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Navigation Bar */}
        <Nav />

        {/* Body */}
        <div className="flex flex-1 flex-row min-h-0">
          {/* Left Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-6">
            <ProgressCard />
            <QuickStats />
            <RecentBadges />
          </div>

          {/* Right Map */}
          <div className="flex-1 p-8 overflow-y-auto relative">
            {/* Legend */}
            <div className="absolute bottom-4 left-4">
              <Legend />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, show landing page
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      <MapHomePage />
      <Features />
      <CTA />
    </div>
  );
}
