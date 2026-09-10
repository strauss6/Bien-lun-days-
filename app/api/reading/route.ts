import { NextResponse } from 'next/server';
import { ReadingRequest, buildReading } from '@/lib/api/reading';

/** Le calcul est lourd et purement déterministe : il tourne côté serveur. */
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête illisible.' }, { status: 400 });
  }

  const parsed = ReadingRequest.safeParse(body);
  if (!parsed.success) {
    // Un seul message, celui qui aide à corriger le champ fautif.
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { error: issue.message, field: issue.path.join('.') || null },
      { status: 422 },
    );
  }

  try {
    return NextResponse.json(buildReading(parsed.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Le calcul a échoué.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
