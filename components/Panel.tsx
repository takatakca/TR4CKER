import { tierAtLeast } from '@/lib/app';
import { cloverConfig } from '@/lib/clover/config';
import { pick } from '@/lib/core/i18n';
import type { PageCtx } from '@/lib/core/page';
import { getSettings, links, listDeliveries } from '@/lib/domain/deliveries';
import { ApiForm } from './ApiForm';
import { RevokeButton } from './RevokeButton';
import { Card, Stat } from './ui';

// TR4CKER dashboard: start a delivery (two links), deliveries of the last 24 h, review settings (Premium).
export async function Panel({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId, tier } = ctx;
  if (!merchantId) return null;
  const [list, s] = await Promise.all([listDeliveries(merchantId), getSettings(merchantId)]);
  const base = cloverConfig.appBaseUrl || '';
  const STATUS: Record<string, [string, string]> = { created: ['À ramasser', 'To pick up'], picked_up: ['En route', 'On the way'], delivered: ['Livrée', 'Delivered'], cancelled: ['Annulée', 'Cancelled'] };
  const rated = list.filter((d) => d.rating !== null);
  return (
    <>
      <div className="grid">
        <Stat label={pick(lang, 'Livraisons (24 h)', 'Deliveries (24 h)')} value={list.length} />
        <Stat label={pick(lang, 'En route', 'On the way')} value={list.filter((d) => d.status === 'picked_up').length} />
        <Stat label={pick(lang, 'Note moyenne', 'Average rating')} value={rated.length ? (rated.reduce((t, d) => t + (d.rating ?? 0), 0) / rated.length).toFixed(1) : '—'} note={`${rated.length} ${pick(lang, 'avis', 'reviews')}`} />
      </div>
      <Card title={pick(lang, 'Nouvelle livraison', 'New delivery')}>
        <ApiForm action="/api/deliveries" fields={[
          { name: 'label', label: pick(lang, 'Numéro de commande', 'Order number'), required: true },
          { name: 'orderRef', label: pick(lang, 'ID commande Clover (facultatif)', 'Clover order ID (optional)') },
          { name: 'customerFirstName', label: pick(lang, 'Prénom du client', 'Customer first name') },
          { name: 'address', label: pick(lang, 'Adresse', 'Address') },
        ]} submit={pick(lang, 'Créer les liens', 'Create the links')}
          onResult={(j) => `${pick(lang, 'Livreur', 'Courier')}: ${j.delivery?.links?.courier}\n${pick(lang, 'Client', 'Customer')}: ${j.delivery?.links?.track}`} />
      </Card>
      <Card title={pick(lang, 'Livraisons', 'Deliveries')}>
        {list.length === 0 ? <p className="muted">—</p> : (
          <table><thead><tr><th>#</th><th>{pick(lang, 'Statut', 'Status')}</th><th>{pick(lang, 'Liens', 'Links')}</th><th>{pick(lang, 'Avis', 'Review')}</th><th /></tr></thead>
            <tbody>{list.map((d) => { const l = links(d, base); return (
              <tr key={d.id}><td>{d.label}{d.source === 'foodhub' ? ' · Food Hub' : ''}</td><td>{pick(lang, ...STATUS[d.status])}</td>
                <td>{l.courier && <a href={l.courier}>{pick(lang, 'livreur', 'courier')}</a>} {l.track && <a href={l.track}>{pick(lang, 'client', 'customer')}</a>}</td>
                <td>{d.rating ? `${d.rating}★${d.feedback ? ` — ${d.feedback}` : ''}` : '—'}</td>
                <td>{d.status !== 'delivered' && d.status !== 'cancelled' && <RevokeButton url={`/api/deliveries?id=${d.id}`} label={pick(lang, 'Annuler', 'Cancel')} />}</td></tr>
            ); })}</tbody></table>
        )}
      </Card>
      {tierAtLeast(tier, 'premium') ? (
        <Card title={pick(lang, 'Avis après livraison', 'Review after delivery')}>
          <p className="muted">{pick(lang, '4–5 étoiles : le client est invité sur votre page Google. 1–3 : l’avis reste ici, privé.', '4–5 stars: the customer is invited to your Google page. 1–3: the review stays here, private.')}</p>
          <ApiForm action="/api/deliveries/settings" method="PUT" fields={[{ name: 'googleReviewUrl', label: pick(lang, 'Lien d’avis Google', 'Google review link'), type: 'url', defaultValue: s.googleReviewUrl ?? '' }]} submit={pick(lang, 'Enregistrer', 'Save')} />
        </Card>
      ) : <p className="muted">{pick(lang, 'Routage des avis vers Google : forfait Premium.', 'Review routing to Google: Premium plan.')}</p>}
    </>
  );
}
