import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'NPS API key not configured' }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('id');

  try {
    if (activityId) {
      // Return park codes for a given activity
      const res = await fetch(
        `https://developer.nps.gov/api/v1/activities/parks?id=${activityId}&limit=500&api_key=${apiKey}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) throw new Error(`NPS error: ${res.status}`);
      const data = await res.json();
      const parkCodes: string[] = (data.data?.[0]?.parks ?? []).map(
        (p: { parkCode: string }) => p.parkCode
      );
      return NextResponse.json(parkCodes);
    } else {
      // Return full activity list
      const res = await fetch(
        `https://developer.nps.gov/api/v1/activities?limit=100&api_key=${apiKey}`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) throw new Error(`NPS error: ${res.status}`);
      const data = await res.json();
      const activities = (data.data ?? []).map((a: { id: string; name: string }) => ({
        id: a.id,
        name: a.name,
      }));
      return NextResponse.json(activities);
    }
  } catch (e) {
    console.error('Error fetching activities:', e);
    return NextResponse.json([]);
  }
}
