"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import NavBar from "@/components/NavBar";
import ProgressCard from "@/components/ProgressCard";
import VisitDateDialog from "@/components/VisitDateDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ParkFromDB {
  park_code: string;
  name: string;
  latitude: string | null;
  longitude: string | null;
  description: string | null;
}

interface ParkWithStatus {
  park_code: string;
  name: string;
  status: 'visited' | 'notVisited' | 'bucketList';
  visitedDate: string | null;
  description?: string;
}

export default function VisitsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [parks, setParks] = useState<ParkWithStatus[]>([]);
  const [totalParksCount, setTotalParksCount] = useState(0);
  const [visitedParksCount, setVisitedParksCount] = useState(0);
  const [bucketListCount, setBucketListCount] = useState(0);
  const [isLoadingParks, setIsLoadingParks] = useState(true);
  const [showVisitDateDialog, setShowVisitDateDialog] = useState(false);
  const [pendingParkCode, setPendingParkCode] = useState<string | null>(null);
  const [pendingParkName, setPendingParkName] = useState<string>("");
  const [isBatchMarkingVisited, setIsBatchMarkingVisited] = useState(false);
  const [isBatchAddingToBucketList, setIsBatchAddingToBucketList] = useState(false);
  const [batchParkCodes, setBatchParkCodes] = useState<string[]>([]);

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

      // Set total parks count
      setTotalParksCount(parksData.length);

      // Get visited park codes, bucket list park codes, and visit dates
      const visitedParkCodes: Set<string> = new Set();
      const bucketListParkCodes: Set<string> = new Set();
      const visitDatesMap: Record<string, string> = {};
      if (visitsResponse.ok) {
        const visitsData: Array<{ park_code: string; is_bucket_list: boolean; visited_date: string | null }> = await visitsResponse.json();
        visitsData.forEach(visit => {
          if (visit.is_bucket_list) {
            bucketListParkCodes.add(visit.park_code);
          } else if (visit.visited_date) {
            visitedParkCodes.add(visit.park_code);
            visitDatesMap[visit.park_code] = visit.visited_date;
          }
        });
        // Count only visited parks (not bucket list)
        setVisitedParksCount(visitedParkCodes.size);
        setBucketListCount(bucketListParkCodes.size);
      } else {
        setVisitedParksCount(0);
        setBucketListCount(0);
      }

      // Transform parks with status
      const transformedParks: ParkWithStatus[] = parksData.map(park => {
        let status: 'visited' | 'notVisited' | 'bucketList' = 'notVisited';
        if (visitedParkCodes.has(park.park_code)) {
          status = 'visited';
        } else if (bucketListParkCodes.has(park.park_code)) {
          status = 'bucketList';
        }
        return {
          park_code: park.park_code,
          name: park.name,
          status,
          visitedDate: visitDatesMap[park.park_code] || null,
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

  const handleMarkVisited = (parkCode: string) => {
    const park = parks.find(p => p.park_code === parkCode);
    if (park) {
      setPendingParkCode(parkCode);
      setPendingParkName(park.name);
      setShowVisitDateDialog(true);
    }
  };

  const handleConfirmVisitDate = async (date: Date) => {
    if (!pendingParkCode && !isBatchMarkingVisited) return;

    // Handle batch marking all bucket list parks as visited
    if (isBatchMarkingVisited) {
      try {
        // Mark all bucket list parks as visited with the same date
        await Promise.all(
          batchParkCodes.map(parkCode =>
            fetch('/api/visits', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                park_code: parkCode,
                is_bucket_list: false,
                visited_date: date.toISOString()
              }),
            })
          )
        );

        // Update all parks in local state
        setParks(prevParks =>
          prevParks.map(p =>
            batchParkCodes.includes(p.park_code)
              ? { ...p, status: 'visited' as const, visitedDate: date.toISOString() }
              : p
          )
        );

        // Update counts
        setVisitedParksCount(prev => prev + batchParkCodes.length);
        setBucketListCount(prev => Math.max(0, prev - batchParkCodes.length));
      } catch (error) {
        console.error('Error marking parks as visited:', error);
      } finally {
        setIsBatchMarkingVisited(false);
        setShowVisitDateDialog(false);
        setPendingParkName("");
        setBatchParkCodes([]);
      }
      return;
    }

    // Handle single park visit
    const park = parks.find(p => p.park_code === pendingParkCode);
    const wasAlreadyVisited = park?.status === 'visited';
    const wasBucketList = park?.status === 'bucketList';

    try {
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          park_code: pendingParkCode,
          is_bucket_list: false,
          visited_date: date.toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark park as visited');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(p =>
          p.park_code === pendingParkCode
            ? { ...p, status: 'visited' as const, visitedDate: date.toISOString() }
            : p
        )
      );

      // Update counts
      if (!wasAlreadyVisited) {
        setVisitedParksCount(prev => prev + 1);
        if (wasBucketList) {
          setBucketListCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error marking park as visited:', error);
    } finally {
      setPendingParkCode(null);
      setPendingParkName("");
      setShowVisitDateDialog(false);
    }
  };

  const handleAddAllToBucketList = async () => {
    if (unvisitedParks.length === 0) return;

    setIsBatchAddingToBucketList(true);
    const unvisitedParkCodes = unvisitedParks.map(p => p.park_code);

    try {
      // Add all unvisited parks to bucket list
      await Promise.all(
        unvisitedParkCodes.map(parkCode =>
          fetch('/api/visits', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              park_code: parkCode,
              is_bucket_list: true,
            }),
          })
        )
      );

      // Update all parks in local state
      setParks(prevParks =>
        prevParks.map(p =>
          unvisitedParkCodes.includes(p.park_code)
            ? { ...p, status: 'bucketList' as const }
            : p
        )
      );

      // Update counts
      setBucketListCount(prev => prev + unvisitedParkCodes.length);
    } catch (error) {
      console.error('Error adding parks to bucket list:', error);
    } finally {
      setIsBatchAddingToBucketList(false);
    }
  };

  const handleMarkAllBucketListAsVisited = () => {
    if (bucketListParks.length === 0) return;
    const parkCodes = bucketListParks.map(p => p.park_code);
    setBatchParkCodes(parkCodes);
    setIsBatchMarkingVisited(true);
    setPendingParkName(`${parkCodes.length} parks`);
    setShowVisitDateDialog(true);
  };

  const handleDeleteVisit = async (parkCode: string) => {
    const park = parks.find(p => p.park_code === parkCode);
    const wasVisited = park?.status === 'visited';
    const wasBucketList = park?.status === 'bucketList';

    try {
      const response = await fetch(`/api/visits?park_code=${parkCode}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove visit');
      }

      // Update the park status in the local state
      setParks(prevParks =>
        prevParks.map(p =>
          p.park_code === parkCode
            ? { ...p, status: 'notVisited' as const, visitedDate: null }
            : p
        )
      );

      // Update counts
      if (wasVisited) {
        setVisitedParksCount(prev => Math.max(0, prev - 1));
      }
      if (wasBucketList) {
        setBucketListCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error removing visit:', error);
    }
  };

  // Get parks by status
  const visitedParks = parks.filter(p => p.status === 'visited').sort((a, b) => {
    if (!a.visitedDate) return 1;
    if (!b.visitedDate) return -1;
    return new Date(b.visitedDate).getTime() - new Date(a.visitedDate).getTime();
  });
  const bucketListParks = parks.filter(p => p.status === 'bucketList').sort((a, b) => a.name.localeCompare(b.name));
  const unvisitedParks = parks.filter(p => p.status === 'notVisited').sort((a, b) => a.name.localeCompare(b.name));

  // Get title
  const title = user?.firstName ? `${user.firstName}'s Visits` : 'My Visits';

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {/* Loading state */}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Please sign in to view your visits</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Navigation Bar */}
      <NavBar
        visitedParksCount={visitedParksCount}
        totalParksCount={totalParksCount}
      />

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

          {/* Progress Card and Counters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Progress Card */}
            <div className="md:col-span-2">
              <ProgressCard
                visitedCount={visitedParksCount}
                totalCount={totalParksCount}
              />
            </div>

            {/* Counters */}
            <div className="flex flex-row space-x-4">
              <Card className="flex-1 bg-green-50 border-green-200 border-2">
                <CardHeader className="">
                  <CardTitle className="text-base font-semibold text-center">Parks Visited</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-center text-green-600">{visitedParksCount}</div>
                </CardContent>
              </Card>
              <Card className="flex-1 bg-amber-50 border-amber-200 border-2">
                <CardHeader className="">
                  <CardTitle className="text-base font-semibold text-center">On Bucket List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-center text-amber-500">{bucketListCount}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingParks ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg text-gray-600">Loading visits...</div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Visited Parks Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Visited Parks ({visitedParks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {visitedParks.length === 0 ? (
                    <p className="text-gray-500 py-4">You haven&apos;t visited any parks yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Park Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Visit Date</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitedParks.map((park) => (
                            <tr key={park.park_code} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{park.name}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {park.visitedDate
                                  ? new Date(park.visitedDate).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : 'No date set'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteVisit(park.park_code)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  aria-label={`Remove ${park.name} from visited parks`}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bucket List Parks Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-xl">Bucket List ({bucketListParks.length})</CardTitle>
                  {bucketListParks.length > 0 && (
                    <Button
                      onClick={handleMarkAllBucketListAsVisited}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                      disabled={isBatchMarkingVisited}
                    >
                      Mark All as Visited
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {bucketListParks.length === 0 ? (
                    <p className="text-gray-500 py-4">Your bucket list is empty.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Park Name</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bucketListParks.map((park) => (
                            <tr key={park.park_code} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{park.name}</td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteVisit(park.park_code)}
                                  className="text-gray-400 hover:text-red-600 transition-colors"
                                  aria-label={`Remove ${park.name} from bucket list`}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Unvisited Parks Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-xl">Unvisited Parks ({unvisitedParks.length})</CardTitle>
                  {unvisitedParks.length > 0 && (
                    <Button
                      onClick={handleAddAllToBucketList}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      size="sm"
                      disabled={isBatchAddingToBucketList}
                    >
                      {isBatchAddingToBucketList ? 'Adding...' : 'Add All to Bucket List'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {unvisitedParks.length === 0 ? (
                    <p className="text-gray-500 py-4">Congratulations! You&apos;ve visited all parks!</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Park Name</th>
                            <th className="text-right py-3 px-4 font-semibold text-gray-700">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unvisitedParks.map((park) => (
                            <tr key={park.park_code} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">{park.name}</td>
                              <td className="py-3 px-4 text-right">
                                <Button
                                  onClick={() => handleMarkVisited(park.park_code)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  Mark as Visited
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Visit Date Dialog */}
      <VisitDateDialog
        open={showVisitDateDialog}
        onOpenChange={setShowVisitDateDialog}
        parkName={pendingParkName}
        onConfirm={handleConfirmVisitDate}
      />
    </div>
  );
}