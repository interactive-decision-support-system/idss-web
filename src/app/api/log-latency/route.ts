// Simple Next.js API route to receive frontend latency logs
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // You can store this in a database, send to a log aggregator, etc.
    // For now, just print to server logs
    console.log('[FRONTEND LATENCY LOG]', body);
    return new Response('ok', { status: 200 });
  } catch (err) {
    return new Response('error', { status: 400 });
  }
}
export const dynamic = 'force-dynamic';
