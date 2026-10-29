import type { Metadata } from 'next';
import { Courier } from '@/components/Courier';
import { byToken } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'TR4CKER — Livreur', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function CourierPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const f = await byToken(token, 'courier');
  if (!f) return <main><h1>TR4CKER</h1><p>Lien inconnu ou expiré. / Unknown or expired link.</p></main>;
  return <Courier token={token} label={f.d.label} initial={f.d.status} address={f.d.address} />;
}
