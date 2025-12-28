"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
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
import Map from "@/components/Map";

interface ParkFromDB {
  park_code: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
}

interface ParkForMap {
  park_code: string;
  name: string;
  position: [number, number];
  status: 'visited' | 'notVisited' | 'bucketList';
  description?: string;
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const [parks, setParks] = useState<ParkForMap[]>([]);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);
  const [isLoadingParks, setIsLoadingParks] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchParksAndVisits();
    }
  }, [isSignedIn]);

  const fetchParksAndVisits = async () => {
    try {
      setIsLoadingParks(true);
      
      // Fetch parks and visits in parallel
      const [parksResponse, visitsResponse] = await Promise.all([
        fetch('/api/parks'),
        fetch('/api/visits')
      ]);

      if (!parksResponse.ok) {
        throw new Error('Failed to fetch parks');
      }

      const parksData: ParkFromDB[] = await parksResponse.json();
      
      // Set total parks count (all parks, not just those with coordinates)
      setTotalParksCount(parksData.length);
      
      // Get visited park codes and bucket list park codes
      let visitedParkCodes: Set<string> = new Set();
      let bucketListParkCodes: Set<string> = new Set();
      if (visitsResponse.ok) {
        const visitsData: Array<{ park_code: string; is_bucket_list: boolean; visited_date: string | null }> = await visitsResponse.json();
        visitsData.forEach(visit => {
          if (visit.is_bucket_list) {
            bucketListParkCodes.add(visit.park_code);
          } else if (visit.visited_date) {
            visitedParkCodes.add(visit.park_code);
          }
        });
        // Count only visited parks (not bucket list)
        setVisitedParksCount(visitedParkCodes.size);
      } else {
        setVisitedParksCount(0);
      }
      
      // Transform database parks to map format (only parks with coordinates)
      const transformedParks: ParkForMap[] = parksData
        .filter(park => park.latitude && park.longitude)
        .map(park => {
          let status: 'visited' | 'notVisited' | 'bucketList' = 'notVisited';
          if (visitedParkCodes.has(park.park_code)) {
            status = 'visited';
          } else if (bucketListParkCodes.has(park.park_code)) {
            status = 'bucketList';
          }
          return {
            park_code: park.park_code,
            name: park.name,
            position: [
              parseFloat(park.latitude!),
              parseFloat(park.longitude!)
            ] as [number, number],
            status,
            description: park.description || undefined,
          };
        });
      
      setParks(transformedParks);
    } catch (error) {
      console.error('Error fetching parks:', error);
    } finally {
      setIsLoadingParks(false);
    }
  };

  const handleMarkVisited = async (parkCode: string) => {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ park_code: parkCode, is_bucket_list: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark park as visited');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(park =>
          park.park_code === parkCode
            ? { ...park, status: 'visited' as const }
            : park
        )
      );
      
      // Update visited count
      setVisitedParksCount(prev => prev + 1);
    } catch (error) {
      console.error('Error marking park as visited:', error);
    }
  };

  const handleAddToBucketList = async (parkCode: string) => {
    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ park_code: parkCode, is_bucket_list: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to add park to bucket list');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(park =>
          park.park_code === parkCode
            ? { ...park, status: 'bucketList' as const }
            : park
        )
      );
    } catch (error) {
      console.error('Error adding park to bucket list:', error);
    }
  };

  const handleRemoveFromBucketList = async (parkCode: string) => {
    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove park from bucket list');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(park =>
          park.park_code === parkCode
            ? { ...park, status: 'notVisited' as const }
            : park
        )
      );
    } catch (error) {
      console.error('Error removing park from bucket list:', error);
    }
  };

  const handleMarkNotVisited = async (parkCode: string) => {
    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to mark park as unvisited');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(park =>
          park.park_code === parkCode
            ? { ...park, status: 'notVisited' as const }
            : park
        )
      );
      
      // Update visited count
      setVisitedParksCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking park as unvisited:', error);
    }
  };

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
      <div className="flex flex-col h-screen">
        {/* Navigation Bar */}
        <Nav 
          visitedParksCount={visitedParksCount}
          totalParksCount={totalParksCount}
        />

        {/* Body */}
        <div className="flex flex-1 flex-row min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto p-6">
            <ProgressCard 
              visitedCount={visitedParksCount}
              totalCount={totalParksCount}
            />
            <QuickStats 
              statesCount={0}
              badgesCount={0}
              photosCount={0}
              postsCount={0}
            />
            <RecentBadges />
          </div>

          {/* Right Map */}
          <div className="flex-1 relative overflow-hidden z-0">
            {isLoadingParks ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-lg text-gray-600">Loading parks...</div>
              </div>
            ) : (
              <>
                {/* Map */}
                <Map 
                  center={[39.8283, -98.5795]} 
                  zoom={4}
                  className="h-full w-full"
                  parks={parks}
                  onMarkVisited={handleMarkVisited}
                  onAddToBucketList={handleAddToBucketList}
                  onRemoveFromBucketList={handleRemoveFromBucketList}
                  onMarkNotVisited={handleMarkNotVisited}
                />
                
                {/* Legend - positioned over the map */}
                <div className="absolute bottom-4 left-4 z-[100]">
                  <Legend />
                </div>
              </>
            )}
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
