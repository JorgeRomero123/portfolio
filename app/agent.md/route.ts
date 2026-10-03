import { getAgentBrief } from '@/lib/content';

export const dynamic = 'force-static';

// Served as text/plain so every browser shows it inline instead of downloading it.
export async function GET() {
  return new Response(await getAgentBrief(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
