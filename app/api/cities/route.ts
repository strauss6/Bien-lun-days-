import { NextResponse } from 'next/server';
import { searchCities } from '@/lib/cities/search';

/** L'index de villes vit côté serveur : le client ne reçoit que dix résultats. */
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  return NextResponse.json({ cities: searchCities(query) });
}
