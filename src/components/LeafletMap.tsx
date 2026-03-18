'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { CheckCircle2, Bookmark, BookmarkX, Pencil } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Park {
  park_code: string;
  name: string;
  position: [number, number];
  status: 'visited' | 'notVisited' | 'bucketList';
  description?: string;
  visitedDate?: string | null;
  title?: string | null;
  notes?: string | null;
  photos?: string[] | null;
  visibility?: string | null;
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
  onEditVisit?: (parkCode: string) => void;
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
  onEditVisit,
}: LeafletMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [markerIcons, setMarkerIcons] = useState<{
    visited: L.DivIcon;
    notVisited: L.DivIcon;
    bucketList: L.DivIcon;
  } | null>(null);
  const [pendingUnvisit, setPendingUnvisit] = useState<{ code: string; name: string } | null>(null);

  useEffect(() => {
    setTimeout(() => {
      setIsClient(true);
    }, 0);

    setTimeout(() => {
      setMarkerIcons({
        visited: createCustomIcon('#16a34a'),
        notVisited: createCustomIcon('#d1d5db'),
        bucketList: createCustomIcon('#facc15'),
      });
    }, 0);
  }, []);

  if (!isClient || !markerIcons) {
    return <div className={`bg-gray-200 animate-pulse ${className}`} />;
  }

  return (
    <>
      <MapContainer
          center={center}
          zoom={zoom}
          className={className}
          maxBounds={[
              [-16.0, -180.0],
              [75.0, -42.0]
          ]}
          maxBoundsViscosity={1.0}
          minZoom={3}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {parks.map((park) => (
          <Marker
            key={park.park_code}
            position={park.position}
            icon={markerIcons[park.status]}
          >
            <Popup>
              <div className="min-w-[200px]">
                <a
                  href={`/parks/${park.park_code}`}
                  className="font-semibold text-green-700 hover:text-green-900 hover:underline"
                >
                  {park.name}
                </a>
                {onMarkVisited ? (
                  park.status === 'visited' && park.visitedDate ? (
                    <div className="text-sm text-gray-600 mt-1 mb-3">
                      Visited on {new Date(park.visitedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1 mb-3">Not yet visited</div>
                  )
                ) : (
                  park.description && (
                    <div className="text-sm text-gray-600 mt-1 mb-3">{park.description}</div>
                  )
                )}

                <div className="flex flex-col gap-2 mt-2">
                  {park.status === 'visited' ? (
                    onEditVisit && (
                      <button
                        onClick={() => onEditVisit(park.park_code)}
                        className="w-full px-3 py-1.5 border border-gray-300 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Edit Visit
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

                  {park.status !== 'visited' && (
                    <>
                      {park.status === 'bucketList' && onRemoveFromBucketList && (
                        <button
                          onClick={() => onRemoveFromBucketList(park.park_code)}
                          className="w-full px-3 py-1.5 border border-yellow-400 text-yellow-600 text-sm font-medium rounded-md hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <BookmarkX className="w-4 h-4" />
                          Remove from Bucket List
                        </button>
                      )}
                      {park.status !== 'bucketList' && onAddToBucketList && (
                        <button
                          onClick={() => onAddToBucketList(park.park_code)}
                          className="w-full px-3 py-1.5 bg-yellow-500 text-white text-sm font-medium rounded-md hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2"
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

      {/* Confirmation dialog — rendered outside MapContainer so it works in React's tree */}
      <AlertDialog open={!!pendingUnvisit} onOpenChange={open => { if (!open) setPendingUnvisit(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this visit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium text-gray-900">{pendingUnvisit?.name}</span> from your visited parks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingUnvisit(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingUnvisit) onMarkNotVisited?.(pendingUnvisit.code);
                setPendingUnvisit(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
