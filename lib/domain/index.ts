// TR4CKER's side of the shared shell: hooks, menu sections, authorized actions, device kinds, what each plan adds.
// Food Hub direct delivery orders create their delivery; cron drops old positions and links.
import type { AppHooks } from '../hooks';
import type { AppAction, AppSection, DeviceKind, TierFeatures } from '../nav';
import { fromFoodHub, sweep } from './deliveries';

export const hooks: AppHooks = {
  async onSuiteEvent(e) {
    if (e.type === 'order.created') await fromFoodHub(e.data?.order);
  },
  async tick() { return sweep(); },
};

export const sections: AppSection[] = [
  { slug: '', fr: 'En cours', en: 'In progress', icon: 'truck', hintFr: 'Les livraisons à ramasser et en route, avec leurs liens.', hintEn: 'Deliveries to pick up and on the way, with their links.' },
  { slug: 'new', fr: 'Nouvelle livraison', en: 'New delivery', icon: 'plus', view: 'deliveries.manage', hintFr: 'Deux liens : un pour le livreur, un pour le client.', hintEn: 'Two links: one for the courier, one for the customer.' },
  { slug: 'deliveries', fr: 'Historique', en: 'History', icon: 'list', hintFr: 'Toutes les livraisons de la période, leur état et leur avis.', hintEn: 'Every delivery of the period, its status and review.' },
  { slug: 'reviews', fr: 'Avis', en: 'Reviews', icon: 'star', tier: 'premium', hintFr: 'Les bons avis vers Google, les autres gardés en privé.', hintEn: 'Good reviews to Google, the others kept private.' },
];

export const actions: AppAction[] = [
  { key: 'deliveries.manage', fr: 'Créer et annuler des livraisons', en: 'Create and cancel deliveries', min: 'employee' },
  { key: 'deliveries.settings', fr: 'Changer le lien d’avis Google', en: 'Change the Google review link', min: 'manager' },
];

export const deviceKinds: DeviceKind[] = [{ kind: 'dispatch', fr: 'Poste de répartition', en: 'Dispatch station' }];

export const tierFeatures: TierFeatures = {
  base: [
    ['Un lien livreur et un lien client pour chaque livraison', 'A courier link and a customer link for each delivery'],
    ['Position du livreur en direct sur la page du client', 'Live courier position on the customer page'],
    ['Livraisons créées seules pour les commandes directes de Food Hub', 'Deliveries created by themselves for Food Hub direct orders'],
  ],
  premium: [
    ['Avis après livraison : 4–5 étoiles vers Google, 1–3 gardés en privé', 'Review after delivery: 4–5 stars to Google, 1–3 kept private'],
    ['Bientôt : pourboire après livraison (lien Ecommerce Clover)', 'Coming: tip after delivery (Clover Ecommerce link)'],
  ],
  vip: [
    ['Bientôt : paiement à la porte, preuves de livraison, pourboires vers 4CCOUNTING', 'Coming: pay at the door, proof of delivery, tips to 4CCOUNTING'],
  ],
};
