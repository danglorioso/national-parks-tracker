'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CheckCircle2, Bookmark, CircleX, BookmarkX } from 'lucide-react';

export interface Park {
  park_code: string;
  name: string;
  position: [number, number];
  status: 'visited' | 'notVisited' | 'bucketList';
  description?: string;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  parks?: Park[];
  onMarkVisited?: (parkCode: string) => void;
  onAddToBucketList?: (parkCode: string) => void;
  onRemoveFromBucketList?: (parkCode: string) => void;
  onMarkNotVisited?: (parkCode: string) => void;
}

const createCustomIcon = (color: string) => {
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        width: 20px;
        height: 20px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function LeafletMap({ 
  center = [42.47, -71.49], 
  zoom = 13,
  className = "h-96 w-full",
  parks = [],
  onMarkVisited,
  onAddToBucketList,
  onRemoveFromBucketList,
  onMarkNotVisited,
}: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [markerIcons, setMarkerIcons] = useState<{
    visited: L.DivIcon;
    notVisited: L.DivIcon;
    bucketList: L.DivIcon;
  } | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 0);
    
    // Create custom icons only on client side
    setTimeout(() => {
      setMarkerIcons({
        visited: createCustomIcon('#16a34a'), // green-600
        notVisited: createCustomIcon('#d1d5db'), // gray-300
        bucketList: createCustomIcon('#facc15'), // yellow-400
      });
    }, 0);
  }, []);

  if (!isClient || !markerIcons) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return (
    <MapContainer 
        center={center} 
        zoom={zoom} 
        className={className}
        maxBounds={[
            [24.396308, -125.0], // Southwest corner
            [49.384358, -66.93457] // Northeast corner
        ]}
        maxBoundsViscosity={1.0}
        minZoom={3}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {parks.map((park) => (
        <Marker 
          key={park.park_code}
          position={park.position}
          icon={markerIcons[park.status]}
        >
          <Popup>
            <div className="min-w-[200px]">
              <div className="font-semibold">{park.name}</div>
              {park.description && (
                <div className="text-sm text-gray-600 mt-1 mb-3">{park.description}</div>
              )}

              <div className="flex flex-col gap-2 mt-2">
                {/* Mark Visited / Mark Unvisited (opposites) */}
                {park.status === 'visited' ? (
                  onMarkNotVisited && (
                    <button
                      onClick={() => onMarkNotVisited(park.park_code)}
                      className="w-full px-3 py-1.5 border border-gray-600 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <CircleX className="w-4 h-4" />
                      Mark Unvisited
                    </button>
                  )
                ) : (
                  onMarkVisited && (
                    <button
                      onClick={() => onMarkVisited(park.park_code)}
                      className="w-full px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Mark Visited
                    </button>
                  )
                )}

                {/* Add to Bucket List / Remove from Bucket List (opposites) - only show if not visited */}
                {park.status !== 'visited' && (
                  <>
                    {park.status === 'bucketList' && onRemoveFromBucketList && (
                      <button
                        onClick={() => onRemoveFromBucketList(park.park_code)}
                        className="w-full px-3 py-1.5 border border-yellow-600 text-yellow-600 text-sm font-medium rounded-md hover:bg-yellow-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <BookmarkX className="w-4 h-4" />
                        Remove from Bucket List
                      </button>
                    )}
                    {park.status !== 'bucketList' && onAddToBucketList && (
                      <button
                        onClick={() => onAddToBucketList(park.park_code)}
                        className="w-full px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Bookmark className="w-4 h-4" />
                        Add to Bucket List
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}