import type { Metadata } from 'next';
import { Feedback } from '@/components/Feedback';
import { pick } from '@/lib/core/i18n';
import { pageContext } from '@/lib/core/page';
import { byToken } from '@/lib/domain/deliveries';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Suivi de livraison / Delivery tracking', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { lang } = await pageContext();
  const f = await byToken(token, 'track');
  if (!f) return <main><h1>TR4CKER</h1><p>{pick(lang, 'Lien inconnu ou expiré.', 'Unknown or expired link.')}</p></main>;
  const d = f.d;
  const steps: Array<[boolean, string]> = [
    [true, pick(lang, 'Commande reçue', 'Order received')],
    [d.status === 'picked_up' || d.status === 'delivered', pick(lang, 'En route', 'On the way')],
    [d.status === 'delivered', pick(lang, 'Livrée', 'Delivered')],
  ];
  const ago = d.lastPos ? Math.max(0, Math.round((Date.now() - Date.parse(d.lastPos.at)) / 60000)) : null;
  return (
    <main>
      {d.status !== 'delivered' && d.status !== 'cancelled' && <meta httpEquiv="refresh" content="20" />}
      <p className="muted">TR4CKER</p>
      <h1>{d.customerFirstName ? pick(lang, `Bonjour ${d.customerFirstName} !`, `Hi ${d.customerFirstName}!`) : pick(lang, 'Votre livraison', 'Your delivery')} · {d.label}</h1>
      {d.status === 'cancelled' ? <p className="banner banner-warn">{pick(lang, 'Cette livraison a été annulée.', 'This delivery was cancelled.')}</p> : (
        <ol>{steps.map(([doneStep, text]) => <li key={text} style={{ fontWeight: doneStep ? 800 : 400, color: doneStep ? 'var(--white)' : 'var(--silver)' }}>{doneStep ? '✓ ' : ''}{text}</li>)}</ol>
      )}
      {d.status === 'picked_up' && d.lastPos && (
        <p>{pick(lang, 'Position du livreur', 'Courier position')} ({ago} min) · <a href={`https://www.openstreetmap.org/?mlat=${d.lastPos.lat}&mlon=${d.lastPos.lng}#map=16/${d.lastPos.lat}/${d.lastPos.lng}`} target="_blank" rel="noreferrer">{pick(lang, 'Voir sur la carte', 'See on the map')}</a></p>
      )}
      {d.status === 'delivered' && (d.rating === null ? <Feedback token={token} lang={lang} /> : <p className="muted">{pick(lang, 'Merci pour votre avis !', 'Thank you for your review!')}</p>)}
    </main>
  );
}
