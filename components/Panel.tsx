import { cloverConfig } from '@/lib/clover/config';
import { pick } from '@/lib/core/i18n';
import type { PageCtx } from '@/lib/core/page';
import { getSettings, links, listDeliveries, type Delivery } from '@/lib/domain/deliveries';
import { ApiForm } from './ApiForm';
import { RevokeButton } from './RevokeButton';
import { Badge, Card, Empty, Stat } from './ui';

// TR4CKER screens (lib/domain `sections`): deliveries in progress, new delivery, history, reviews (Premium).
const STATUS: Record<string, [string, string, 'plain' | 'brand' | 'ok' | 'warn']> = {
  created: ['À ramasser', 'To pick up', 'plain'], picked_up: ['En route', 'On the way', 'brand'], delivered: ['Livrée', 'Delivered', 'ok'], cancelled: ['Annulée', 'Cancelled', 'warn'],
};

export async function Panel({ ctx, section, query }: { ctx: PageCtx; section: string; query?: Record<string, string> }) {
  switch (section) {
    case '': return <InProgress ctx={ctx} />;
    case 'new': return <NewDelivery ctx={ctx} />;
    case 'deliveries': return <History ctx={ctx} days={query?.days === '7' ? 7 : 1} />;
    case 'reviews': return <Reviews ctx={ctx} />;
    default: return null;
  }
}

function Table({ ctx, list, actions }: { ctx: PageCtx; list: Delivery[]; actions: boolean }) {
  const { lang } = ctx;
  const base = cloverConfig.appBaseUrl || '';
  const time = (iso: string | null) => (iso ? new Date(iso).toLocaleString(lang === 'en' ? 'en-CA' : 'fr-CA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }) : '—');
  const can = actions && ctx.can('deliveries.manage');
  return (
    <div className="table-wrap"><table>
      <thead><tr><th>#</th><th>{pick(lang, 'Client', 'Customer')}</th><th>{pick(lang, 'État', 'Status')}</th><th>{pick(lang, 'Créée', 'Created')}</th><th>{pick(lang, 'Liens', 'Links')}</th><th>{pick(lang, 'Avis', 'Review')}</th><th /></tr></thead>
      <tbody>{list.map((d) => {
        const l = links(d, base);
        const [fr, en, tone] = STATUS[d.status];
        return (
          <tr key={d.id}>
            <td><strong>{d.label}</strong>{d.source === 'foodhub' && <div className="muted small">Food Hub</div>}</td>
            <td>{d.customerFirstName ?? '—'}{d.address && <div className="muted small">{d.address}</div>}</td>
            <td><Badge tone={tone}>{pick(lang, fr, en)}</Badge></td>
            <td className="nowrap">{time(d.createdAt)}</td>
            <td>{l.courier && <a href={l.courier} target="_blank" rel="noopener noreferrer">{pick(lang, 'livreur', 'courier')}</a>} {l.track && <a href={l.track} target="_blank" rel="noopener noreferrer">{pick(lang, 'client', 'customer')}</a>}</td>
            <td>{d.rating ? `${'★'.repeat(d.rating)}${d.feedback ? ` — ${d.feedback}` : ''}` : '—'}</td>
            <td className="right">{can && d.status !== 'delivered' && d.status !== 'cancelled' && <RevokeButton url={`/api/deliveries?id=${d.id}`} label={pick(lang, 'Annuler', 'Cancel')} confirm={pick(lang, `Annuler la livraison ${d.label} ? Les liens cesseront de fonctionner.`, `Cancel delivery ${d.label}? The links will stop working.`)} />}</td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

async function InProgress({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const list = await listDeliveries(merchantId!);
  const open = list.filter((d) => d.status === 'created' || d.status === 'picked_up');
  const rated = list.filter((d) => d.rating !== null);
  return (
    <>
      <div className="grid">
        <Stat label={pick(lang, 'Livraisons (24 h)', 'Deliveries (24 h)')} value={list.length} />
        <Stat label={pick(lang, 'À ramasser', 'To pick up')} value={list.filter((d) => d.status === 'created').length} />
        <Stat label={pick(lang, 'En route', 'On the way')} value={list.filter((d) => d.status === 'picked_up').length} />
        <Stat label={pick(lang, 'Note moyenne', 'Average rating')} value={rated.length ? `${(rated.reduce((t, d) => t + (d.rating ?? 0), 0) / rated.length).toFixed(1)} ★` : '—'} note={`${rated.length} ${pick(lang, 'avis', 'reviews')}`} />
      </div>
      <Card title={pick(lang, 'En cours', 'In progress')} icon="truck" right={ctx.can('deliveries.manage') ? <a className="btn" href="/app/new">{pick(lang, 'Nouvelle livraison', 'New delivery')}</a> : undefined}>
        {open.length === 0 ? <Empty icon="truck">{pick(lang, 'Aucune livraison en cours.', 'No delivery in progress.')}</Empty> : <Table ctx={ctx} list={open} actions />}
      </Card>
    </>
  );
}

function NewDelivery({ ctx }: { ctx: PageCtx }) {
  const { lang } = ctx;
  return (
    <Card title={pick(lang, 'Nouvelle livraison', 'New delivery')} icon="plus" sub={pick(lang, 'Envoyez le premier lien au livreur, le second au client. Aucun téléphone n’est gardé.', 'Send the first link to the courier, the second to the customer. No phone number is kept.')}>
      <ApiForm action="/api/deliveries" lang={lang} fields={[
        { name: 'label', label: pick(lang, 'Numéro de commande', 'Order number'), required: true },
        { name: 'orderRef', label: pick(lang, 'ID commande Clover (facultatif)', 'Clover order ID (optional)') },
        { name: 'customerFirstName', label: pick(lang, 'Prénom du client', 'Customer first name') },
        { name: 'address', label: pick(lang, 'Adresse', 'Address') },
      ]} submit={pick(lang, 'Créer les liens', 'Create the links')}
        result={pick(lang, 'Livreur : {delivery.links.courier}\nClient : {delivery.links.track}', 'Courier: {delivery.links.courier}\nCustomer: {delivery.links.track}')} />
    </Card>
  );
}

async function History({ ctx, days }: { ctx: PageCtx; days: 1 | 7 }) {
  const { lang, merchantId } = ctx;
  const list = await listDeliveries(merchantId!, days * 24);
  return (
    <Card title={days === 7 ? pick(lang, '7 derniers jours', 'Last 7 days') : pick(lang, 'Dernières 24 heures', 'Last 24 hours')} icon="list"
      right={<div className="row"><a className={`btn${days === 1 ? '' : ' ghost'}`} href="/app/deliveries">24 h</a><a className={`btn${days === 7 ? '' : ' ghost'}`} href="/app/deliveries?days=7">7 {pick(lang, 'jours', 'days')}</a></div>}>
      {list.length === 0 ? <Empty icon="truck">{pick(lang, 'Aucune livraison sur la période.', 'No delivery in the period.')}</Empty> : <Table ctx={ctx} list={list} actions />}
    </Card>
  );
}

async function Reviews({ ctx }: { ctx: PageCtx }) {
  const { lang, merchantId } = ctx;
  const [s, list] = await Promise.all([getSettings(merchantId!), listDeliveries(merchantId!, 7 * 24)]);
  const rated = list.filter((d) => d.rating !== null);
  return (
    <>
      <Card title={pick(lang, 'Où vont les bons avis', 'Where good reviews go')} icon="star" sub={pick(lang, '4–5 étoiles : le client est invité sur votre page Google. 1–3 : l’avis reste ici, privé, pour vous.', '4–5 stars: the customer is invited to your Google page. 1–3: the review stays here, private, for you.')}>
        {ctx.can('deliveries.settings')
          ? <ApiForm action="/api/deliveries/settings" method="PUT" fields={[{ name: 'googleReviewUrl', label: pick(lang, 'Lien d’avis Google', 'Google review link'), type: 'url', defaultValue: s.googleReviewUrl ?? '' }]} submit={pick(lang, 'Enregistrer', 'Save')} done={pick(lang, 'Enregistré.', 'Saved.')} />
          : <p className="muted">{s.googleReviewUrl ?? pick(lang, 'Aucun lien pour l’instant.', 'No link yet.')}</p>}
      </Card>
      <Card title={pick(lang, 'Avis des 7 derniers jours', 'Reviews of the last 7 days')} icon="chat">
        {rated.length === 0 ? <Empty icon="star">{pick(lang, 'Aucun avis pour l’instant.', 'No review yet.')}</Empty> : (
          <div className="table-wrap"><table><thead><tr><th>#</th><th>{pick(lang, 'Note', 'Rating')}</th><th>{pick(lang, 'Commentaire (privé)', 'Comment (private)')}</th></tr></thead>
            <tbody>{rated.map((d) => <tr key={d.id}><td>{d.label}</td><td>{'★'.repeat(d.rating ?? 0)}</td><td>{d.feedback ?? '—'}</td></tr>)}</tbody></table></div>
        )}
      </Card>
    </>
  );
}
