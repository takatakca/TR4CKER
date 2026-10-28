# TR4CKER by TAKATAK

**App ID Clover (production) :** `EB2EPCWEJBZ82`
**Développeur :** TAKATAK (compte développeur Clover 9KJ25ATT15TTW)
**État au portail :** brouillon (draft) — rien de soumis.
**Dépôt :** takatakca/TR4CKER

## Ce que fait l'app

Suivi de livraison en direct de nos propres livraisons : position du livreur rattachée à la commande Clover, suivi des pourboires, page client « ajoute un pourboire + avis » après livraison (bon avis → Google ; mauvais → interne), paiement NFC à la porte via la suite.

## Paliers (doctrine de prix de Matt, 2026-10-28)

Chaque app a SES propres paliers. Base = le nécessaire essentiel · Premium = plus d'avantages · VIP = le full kit, tout ce que Clover offre pour la catégorie.

- **Base 50 $/mois** — suivi en direct du livreur rattaché à la commande Clover ; page de suivi client ; statuts synchronisés par webhooks Commandes.
- **Premium 100 $/mois** — + suivi des pourboires (à la commande et après livraison via lien Ecommerce) ; page post-livraison « pourboire + avis » avec routage bon/mauvais avis ; notifications client via CH4T.
- **VIP 150 $/mois** — full kit : paiement à la porte (téléphone du livreur comme terminal — Canada à confirmer pour le lecteur Go) ; ventilation comptable automatique des pourboires et frais vers 4CCOUNTING ; preuves de livraison (photo/signature) rattachées à la commande.

Prix facturés via les plans d'abonnement du Clover App Market (à créer au portail — voir DEPLOY.md).

## Permissions Clover visées

Orders R/W · Payments R/W · Customers R · Merchant R

## Structure

- `docs/listing/` — fiche marketplace (description FR/EN) et textes légaux, depuis le package de soumission local (`~/workspace/clover-apps/`)
- `app/api/clover/` — points d'entrée webhook + OAuth (scaffold, même patron que Food Hub)
- `lib/clover/config.ts` — configuration par variables d'environnement (aucun secret dans le code)
- `config/app.config.json` — identité de l'app et paliers
- `DEPLOY.md` — ce qui reste à faire, étape par étape, pour la vague portail

## Le système unique TAKATAK

Cette application fait partie de la suite TAKATAK sur Clover : toutes les apps partagent le même dos d'événements (webhooks Clover), le même **client unique reconnu par son numéro de téléphone** (+ courriel), et les mêmes commandes et paiements Clover. Aucune app ne vit en silo : les données qu'elle produit alimentent les autres apps de la suite (voir « Clover API — Main Stuff — Robot Notepad », section 3, déposé au Drive Opérations et dans `~/workspace/clover-apps/`).

