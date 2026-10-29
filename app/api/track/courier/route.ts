import { fail, ok, readJson } from '@/lib/core/http';
import { courierUpdate } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';

// The courier's phone (public; the private link token is the credential): { token, action: picked_up | delivered | position, lat?, lng? }
export async function POST(req: Request) {
  const b = await readJson(req);
  if (!b || !['picked_up', 'delivered', 'position'].includes(b.action)) return fail('{ token, action } required');
  const r = await courierUpdate(String(b.token ?? ''), b.action, { lat: b.lat, lng: b.lng });
  return r.ok ? ok({ status: r.status }) : fail(r.error, r.status ?? 400);
}
