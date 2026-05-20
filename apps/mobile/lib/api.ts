import type { EnrichedPost, EnrichedComment, PublicProfile, UserProfile, ParkWithStatus, BadgesResponse, Follow } from '@parkquest/types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function req<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Feed & Posts ───────────────────────────────────────────────────────────────

export const getFeed = (token: string, offset = 0) =>
  req<EnrichedPost[]>(`/api/feed?limit=20&offset=${offset}`, token);

export const getPosts = (token: string | null, userId?: string, parkCode?: string, offset = 0) => {
  const params = new URLSearchParams({ limit: '20', offset: String(offset) });
  if (userId) params.set('userId', userId);
  if (parkCode) params.set('parkCode', parkCode);
  return req<EnrichedPost[]>(`/api/posts?${params}`, token);
};

export const createPost = (token: string, body: { caption?: string; photos?: { url: string; key: string; name: string }[]; park_code?: string }) =>
  req<EnrichedPost>('/api/posts', token, { method: 'POST', body: JSON.stringify(body) });

export const likePost = (token: string, postId: number) =>
  req('/api/likes', token, { method: 'POST', body: JSON.stringify({ postId }) });

export const unlikePost = (token: string, postId: number) =>
  req(`/api/likes?postId=${postId}`, token, { method: 'DELETE' });

export const getComments = (token: string | null, postId: number) =>
  req<EnrichedComment[]>(`/api/comments?postId=${postId}`, token);

export const addComment = (token: string, postId: number, content: string) =>
  req('/api/comments', token, { method: 'POST', body: JSON.stringify({ postId, content }) });

// ── Profile & Users ────────────────────────────────────────────────────────────

export const getOwnProfile = (token: string) =>
  req<UserProfile>('/api/profile', token);

export const updateProfile = (token: string, updates: Partial<Pick<UserProfile, 'username' | 'display_name' | 'bio' | 'avatar_url'>>) =>
  req<UserProfile>('/api/profile', token, { method: 'PUT', body: JSON.stringify(updates) });

export const getUserProfile = (token: string | null, userId: string) =>
  req<PublicProfile>(`/api/profile/${userId}`, token);

export const searchUsers = (token: string | null, query: string) =>
  req<PublicProfile[]>(`/api/users?search=${encodeURIComponent(query)}`, token);

// ── Follows ────────────────────────────────────────────────────────────────────

export const followUser = (token: string, userId: string) =>
  req('/api/follows', token, { method: 'POST', body: JSON.stringify({ userId }) });

export const unfollowUser = (token: string, userId: string) =>
  req(`/api/follows?userId=${userId}`, token, { method: 'DELETE' });

export const getFollowers = (token: string | null, userId: string) =>
  req<Follow[]>(`/api/follows?userId=${userId}&type=followers`, token);

export const getFollowing = (token: string | null, userId: string) =>
  req<Follow[]>(`/api/follows?userId=${userId}&type=following`, token);

// ── Parks & Visits ─────────────────────────────────────────────────────────────

export const getParks = (token: string | null) =>
  req<ParkWithStatus[]>('/api/parks', token);

export const getVisits = (token: string) =>
  req<ParkWithStatus[]>('/api/visits', token);

// ── Badges ─────────────────────────────────────────────────────────────────────

export const getBadges = (token: string) =>
  req<BadgesResponse>('/api/badges', token);
