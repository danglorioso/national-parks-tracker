import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ parkCode: string }> }
) {
  const { parkCode } = await params;
  const apiKey = process.env.NPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'NPS API key not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`NPS API error: ${response.status}`);
    }

    const data = await response.json();
    const park = data.data?.[0];

    if (!park) {
      return NextResponse.json({ error: 'Park not found' }, { status: 404 });
    }

    return NextResponse.json(park);
  } catch (error) {
    console.error('Error fetching park from NPS API:', error);
    return NextResponse.json({ error: 'Failed to fetch park' }, { status: 500 });
  }
}
