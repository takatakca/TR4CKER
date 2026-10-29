import { fail, ok, readJson } from '@/lib/core/http';
import { leaveFeedback } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';

// The customer's review after delivery (public; tracking link token): { token, rating 1-5, comment? }
export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b) return fail('JSON body required');
  const r = await leaveFeedback(String(b.token ?? ''), Number(b.rating), b.comment);
  return r.ok ? ok({ redirect: r.redirect }) : fail(r.error, r.status ?? 400);
}
