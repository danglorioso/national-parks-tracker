export type ParkStatus = 'unvisited' | 'bucket_list' | 'visited';

export interface Park {
  park_code: string;
  name: string;
  states: string;
  description: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: Date | null;
}

export interface PhotoMeta {
  url: string;
  key: string;
  name: string;
}

export interface Visit {
  id: number;
  clerk_user_id: string;
  park_code: string;
  visited_date: Date | null;
  rating: number | null;
  notes: string | null;
  photos: PhotoMeta[] | null;
  is_bucket_list: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ParkWithStatus extends Park {
  status: ParkStatus;
  visit?: Visit;
}

// Shapes returned by /api/parks and /api/visits
export interface ApiPark extends Park {
  status: ParkStatus;
}

export interface ApiVisitResponse {
  park_code: string;
  visited_date: string | null;
  rating: number | null;
  notes: string | null;
  photos: PhotoMeta[] | null;
  is_bucket_list: boolean | null;
}
