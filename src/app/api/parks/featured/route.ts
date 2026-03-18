import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'NPS API key not configured' }, { status: 500 });

  try {
    // Fetch 150 parks with images in one call — NPS allows up to 500
    const res = await fetch(
      `https://developer.nps.gov/api/v1/parks?fields=images&limit=500&api_key=${apiKey}`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (!res.ok) throw new Error(`NPS error: ${res.status}`);
    const data = await res.json();

    const parks = (data.data ?? [])
      .filter((p: { images?: { url: string }[] }) => p.images && p.images.length > 0)
      .map((p: { parkCode: string; fullName: string; images: { url: string; title: string; altText: string }[] }) => ({
        park_code: p.parkCode,
        name: p.fullName,
        images: p.images.slice(0, 3).map((img) => ({
          url: img.url,
          title: img.title,
          alt: img.altText,
        })),
      }));

    return NextResponse.json(parks);
  } catch (e) {
    console.error('Error fetching featured parks:', e);
    return NextResponse.json([], { status: 200 }); // graceful fallback
  }
}
