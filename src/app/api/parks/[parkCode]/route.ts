import { NextResponse } from 'next/server';

// Some parks are stored separately in our DB but share a single NPS API entry.
// Map our DB park_code → the NPS parkCode to use when fetching.
const NPS_CODE_ALIASES: Record<string, string> = {
  sequ: 'seki', // Sequoia NP → Sequoia & Kings Canyon (combined NPS entry)
  king: 'seki', // Kings Canyon NP → same combined entry
};

async function fetchNPSPark(code: string, apiKey: string) {
  const response = await fetch(
    `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  );
  if (!response.ok) throw new Error(`NPS API error: ${response.status}`);
  const data = await response.json();
  return data.data?.[0] ?? null;
}

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
    // Try the requested code first, then fall back to the alias if needed
    const npsCode = parkCode.toLowerCase();
    let park = await fetchNPSPark(npsCode, apiKey);

    if (!park && NPS_CODE_ALIASES[npsCode]) {
      park = await fetchNPSPark(NPS_CODE_ALIASES[npsCode], apiKey);
    }

    if (!park) {
      return NextResponse.json({ error: 'Park not found' }, { status: 404 });
    }

    return NextResponse.json(park);
  } catch (error) {
    console.error('Error fetching park from NPS API:', error);
    return NextResponse.json({ error: 'Failed to fetch park' }, { status: 500 });
  }
}
