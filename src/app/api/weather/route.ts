import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  try {
    // Step 1: Get the NWS grid point for these coordinates
    const pointRes = await fetch(
      `https://api.weather.gov/points/${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`,
      {
        headers: { 'User-Agent': 'NationalParksTracker/1.0' },
        next: { revalidate: 3600 },
      }
    );

    if (!pointRes.ok) {
      // Some locations (territories like American Samoa) are not covered by weather.gov
      return NextResponse.json({ error: 'Location not covered by weather.gov' }, { status: 404 });
    }

    const pointData = await pointRes.json();
    const forecastUrl: string = pointData.properties?.forecast;
    if (!forecastUrl) {
      return NextResponse.json({ error: 'No forecast URL returned' }, { status: 404 });
    }

    // Step 2: Fetch the forecast
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'NationalParksTracker/1.0' },
      next: { revalidate: 3600 },
    });

    if (!forecastRes.ok) {
      throw new Error(`Forecast fetch failed: ${forecastRes.status}`);
    }

    const forecastData = await forecastRes.json();
    const periods: Array<{
      name: string;
      temperature: number;
      temperatureUnit: string;
      shortForecast: string;
      detailedForecast: string;
      icon: string;
      isDaytime: boolean;
      windSpeed: string;
      windDirection: string;
      probabilityOfPrecipitation: { value: number | null };
    }> = forecastData.properties?.periods ?? [];

    // Return the next 7 periods (roughly 3.5 days of day/night pairs)
    const condensed = periods.slice(0, 7).map((p) => ({
      name: p.name,
      temp: p.temperature,
      tempUnit: p.temperatureUnit,
      shortForecast: p.shortForecast,
      detailedForecast: p.detailedForecast,
      icon: p.icon,
      isDaytime: p.isDaytime,
      windSpeed: p.windSpeed,
      windDirection: p.windDirection,
      precipChance: p.probabilityOfPrecipitation?.value ?? null,
    }));

    return NextResponse.json(condensed);
  } catch (e) {
    console.error('Weather fetch error:', e);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
