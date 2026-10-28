# 2026-10-27 03:50 — TR4CKER BY TAKATAK — Spécification complète — modèle par paliers 50 $ / 100 $ / 150 $

Produit de la suite TAKATAK pour le Clover Marketplace. Document de référence — toute modification future se fait en nouvelle version datée, jamais en écrasant l'historique.

---

## 1. Définition du produit

**TR4CKER BY TAKATAK** est l'application de suivi de livraison de TAKATAK. Elle connecte le restaurant, le chauffeur et le client en temps réel : dès que le chauffeur quitte le commerce, le client voit sa commande « en route » sur le site du restaurant, avec un suivi en direct — **« Track my order »**.

Le palier de base (suivi du chauffeur) n'est que la **première pièce** d'un projet beaucoup plus grand : TR4CKER grandit par paliers — suivi des pourboires, puis comptabilité et paiement NFC — jusqu'à transformer le téléphone du chauffeur en véritable **Clover POS mobile**.

**Développement 100 % maison.** TR4CKER est développé, opéré et géré entièrement par TAKATAK. Aucune compagnie tierce, aucun fournisseur externe de suivi. Le client ne fait jamais affaire avec quelqu'un d'autre que TAKATAK.

**Positionnement commercial.** TR4CKER se vend **uniquement en module complémentaire (add-on)** aux clients qui ont déjà :

- un **site web TAKATAK** ;
- les **intégrations Clover pour la livraison**.

**Pilote : pppmtl.com** — notre propre commerce d'abord, comme tous les produits de la suite.

---

## 2. Comment ça fonctionne — de bout en bout

1. **Le téléphone du chauffeur.** Le chauffeur reçoit un **cellulaire d'entreprise fourni par TAKATAK**, avec l'application TR4CKER **déjà installée et autorisée** (localisation activée). Le chauffeur n'a rien à configurer.
2. **L'autorisation du client.** Le client autorise de son côté, dans le parcours du site ou de l'application TAKATAK, le suivi de sa commande.
3. **La commande.** La commande entre dans le **POS Clover** du restaurant (site web branché Clover, Food Hub, ou comptoir). Toute l'information de la commande vit déjà dans le POS.
4. **Le départ.** Quand le chauffeur quitte le commerce avec la commande, l'événement « chauffeur parti » se déclenche dans TR4CKER.
5. **Le suivi client.** L'événement et la position du téléphone alimentent le site du restaurant : la page de la commande passe à « en route » et le client suit la livraison en direct.
6. **Le tableau de bord.** Tout est créé et géré dans le **dashboard TAKATAK V1** et sur la plateforme **takatak.ca** : configuration par marque et par magasin (structure Master → Brand → Group → Store), chauffeurs, événements, historique.
7. **L'arrivée (palier 150 $).** À la porte du client, le chauffeur peut encaisser un **paiement NFC directement sur son téléphone** (voir section 4).

Les connexions se font par **API, webhooks et messages** — jamais par fusion de comptes ni couplage de données à la source (loi d'architecture TAKATAK : penser séparé, connecter par API).

---

## 3. Les trois paliers

Les paliers sont **cumulatifs** : chaque niveau inclut tout le niveau précédent. De nouvelles sections et options s'ajouteront par-dessus au fil du temps — la structure par paliers est faite pour grandir.

### Palier 1 — TRACKING — 50 $/mois (le minimum)

- Autorisation du chauffeur dans l'application (téléphone d'entreprise fourni, installé, autorisé).
- **Suivi en direct du chauffeur** : position du téléphone, événement « chauffeur parti du commerce », événement « commande en route ».
- Page **« Track my order »** sur le site du client, alimentée en temps réel.
- Vue des livraisons en cours dans le dashboard TAKATAK V1.

C'est le socle : on traque le chauffeur, le client suit sa commande.

### Palier 2 — TIPS — 100 $/mois

Tout le palier 1, plus :

- **Suivi des pourboires du chauffeur dans TR4CKER** : chaque pourboire associé à sa livraison et à son chauffeur.
- Historique des pourboires par chauffeur, par livraison, par période — visible dans le dashboard.
- Base de données propre pour la paie et les rapports du chauffeur.

### Palier 3 — ACCOUNTING + PAYMENT — 150 $/mois

Tout le palier 2, plus :

- **Comptabilité** : les données de livraison, de pourboires et de paiements de TR4CKER alimentent **4CCOUNTING BY TAKATAK** — le « counting » est intégré, pas ressaisi à la main.
- **Paiement NFC à la porte** : quand le chauffeur arrive chez le client, il peut prendre le **paiement directement sur son téléphone**, par NFC, via le **webhook de la passerelle de paiement** (voir section 4).

### Paliers futurs

D'autres options et sections viendront s'ajouter au-dessus du 150 $ (upgrades). Chaque nouvelle capacité devient un palier ou une option documentée dans une nouvelle version de cette spécification — jamais un changement silencieux.

---

## 4. Paiement NFC — le téléphone devient un Clover POS

Le principe, dans les mots du propriétaire : toute l'information de la commande est **déjà dans le POS**. Il ne manque au chauffeur qu'un moyen d'encaisser à la porte.

- À l'arrivée chez le client, l'application TR4CKER présente le montant de la commande (déjà connu du POS Clover).
- Le client paie **sans contact (NFC)** directement sur le téléphone du chauffeur.
- Le paiement passe par la **passerelle de paiement via webhook** : confirmation en temps réel, commande marquée payée dans le POS, reçu et écriture comptable générés sans ressaisie.
- Le téléphone du chauffeur devient, à toutes fins pratiques, un **Clover POS mobile**.

**Direction technique retenue** : travailler avec l'écosystème Clover lui-même — se connecter à l'application Clover et utiliser **l'API Clover à l'intérieur de notre propre application** — plutôt que de bâtir une passerelle parallèle. TR4CKER reste notre application ; Clover fournit les rails de paiement et les données du POS.

---

## 5. Interconnexions — tout se connecte

TR4CKER n'est pas un produit isolé. Il fait partie de la suite TAKATAK sur le Clover Marketplace, et **tous les dossiers se connectent entre eux** :

| Produit | Lien avec TR4CKER |
|---|---|
| **FOODHUB** (Food Hub) | Les commandes en ligne entrent par Food Hub / le site branché Clover ; TR4CKER prend le relais dès la sortie du commerce : événement de départ, suivi, livraison. |
| **REW4RD** (cartes-cadeaux) | Le client paie ou complète avec sa carte-cadeau ; le solde et les **points de fidélité** vivent dans son **Google Wallet** — sur **pppmtl.com et sur tous les sites de restaurants connectés à la plateforme TAKATAK** (même modèle de passe partout, solde et points mis à jour en direct). Le suivi TR4CKER et le Wallet racontent la même commande. |
| **ON2GO** | Le marchand pilote et le canal de commande en ligne : les événements TR4CKER (départ, en route, livré) alimentent l'expérience de commande et la page de suivi du client. |
| **4CCOUNTING** | Le palier 150 $ y verse automatiquement livraisons, pourboires et paiements : la comptabilité se nourrit des événements TR4CKER, sans double saisie. |
| **Sites des clients** (pppmtl.com et tous les sites de restaurants TAKATAK) | La page « Track my order » est affichée sur le site du restaurant, branché Clover. TR4CKER fournit les événements et la position ; le site les présente au client. |
| **Dashboard TAKATAK V1 / takatak.ca** | Le centre de contrôle : création des comptes, configuration par marque et par magasin, chauffeurs, paliers, rapports. Tout ce qui se passe dans TR4CKER s'y voit et s'y gère. |
| **Système d'avis TAKATAK** (voir section 6) | Le flux post-livraison « Add tip + Review » collecte le pourboire et l'avis dans le **système d'avis existant de TAKATAK** : widget `takatak-reviews.js` du dépôt `takatakca/takatak-v1` (servi depuis takatak.ca, « Avis recueillis par TAKATAK »), dépôt dédié `takatakca/TAKATAKREVIEW`. On ne réinvente pas un nouveau système. |
| **Clover POS / Clover Marketplace** | TR4CKER est une application du Clover Marketplace ; les commandes, les paiements et les données du POS viennent de Clover, et le paiement NFC du palier 150 $ s'appuie sur l'API Clover. |

Règle qui gouverne l'ensemble : **chaque produit reste séparé et autonome ; les connexions se font par API, webhooks et messages.**

---

## 6. Flux post-livraison — « Add tip + Review »

Directive du propriétaire (2026-10-27 03:52), modelée sur ce qu'Uber vient de lui montrer. La livraison ne se termine pas à la porte : elle se conclut sur le téléphone du client.

### Le flux

1. **Livraison terminée.** Le client reçoit la notification « livraison arrivée chez vous ».
2. **Pop-up « Add tip ».** Un pop-up propose au client d'ajouter un pourboire.
3. **Page de type checkout — un seul geste, deux choses.** En cliquant, le client arrive sur une page simple, de type checkout, où il fait **en même temps** :
   - **(a) un pourboire** pour le service et le chauffeur — ce pourboire est enregistré contre la commande et le chauffeur et **alimente le palier 100 $ (suivi des pourboires)** ;
   - **(b) un avis** — une **note** et un **commentaire** sur comment la livraison et le service se sont passés.

### Routage intelligent des avis — la règle du propriétaire

La note est capturée **en premier** ; c'est elle qui décide du chemin :

- **Avis positif → Google.** Le client est dirigé vers l'**avis Google de l'entreprise** : les bons avis deviennent publics là où ils comptent.
- **Avis négatif → interne.** L'avis est **traité à l'interne** : il part au dashboard du marchand / de TAKATAK pour un suivi, avec le **commentaire conservé intégralement**. Il n'est **jamais poussé en public**.

Le client peut donc laisser un avis Google ou un avis interne — le système trie pour lui, sans friction.

### Réutiliser l'existant — ne pas réinventer

Le propriétaire le dit : « On a un review system dans notre GitHub aussi. » Vérifié le 2026-10-27 dans le GitHub `takatakca` :

- **Système d'avis TAKATAK existant** : le widget **`public/takatak-reviews.js`** du dépôt **`takatakca/takatak-v1`** — badge de note moyenne + commentaires clients, servi depuis **takatak.ca**, intégré aux sites par un simple `<div data-takatak-reviews="…">` par entreprise ; seuls les commentaires que le client a explicitement accepté de publier sont affichés (« Avis recueillis par TAKATAK »).
- **Dépôt dédié `takatakca/TAKATAKREVIEW`** : il existe déjà (créé pour le système d'avis) ; il est **présentement vide** — c'est là que le système d'avis se consolide, pas dans un nouveau dépôt.

Le flux « Add tip + Review » de TR4CKER et l'écran de fin de suivi des sites se **branchent sur ce système existant** (collecte de la note et du commentaire, moyenne, affichage, bouton « Laisser un avis ») : TR4CKER ajoute le déclencheur post-livraison, le pourboire et le routage Google/interne — il ne reconstruit pas la collecte d'avis.

---

## 7. État du dépôt GitHub

- Un dépôt GitHub dédié **`tr4cker`** (sous `takatakca`) est voulu par le propriétaire, avec toute la documentation du produit dedans.
- **Création présentement bloquée** : l'application GitHub retourne **403 — « Resource not accessible by integration »** ; la permission **Administration** doit être accordée par le propriétaire (même geste que le push en attente du dépôt r2neet).
- Le **README du dépôt est écrit et prêt** (`~/workspace/github-packs/2026-10-27 03:45 — TR4CKER — README dépôt GitHub.md`) : dès que le dépôt existe, il est poussé immédiatement, suivi de la présente spécification.
- En attendant, le brief vivant du produit est l'**issue nº 17** du dépôt `takatakca/pppmtl` (pilote), et la documentation est déposée au Google Drive (Opérations TAKATAK, dossier PPP, dossier Clover POS).
- **Aucun secret dans git, jamais** : les clés Clover et les identifiants vivent dans les variables d'environnement du serveur et dans le coffre sécurisé seulement.

---

## 8. Missions — à compléter par Taktak ou les agents désignés

Le propriétaire ne doit jamais avoir à répéter ces demandes. Chaque mission est un livrable vérifiable.

1. **Dépôt GitHub `tr4cker`** — dès la permission Administration accordée : créer le dépôt sous `takatakca`, pousser le README prêt, puis la présente spécification. Vérifier le push en relisant le dépôt.
2. **Application chauffeur (palier 50 $)** — développer l'application TR4CKER : autorisation du chauffeur, localisation du téléphone d'entreprise, événements « départ du commerce » et « commande en route », envoi des événements par API/webhooks vers le site du client et le dashboard V1.
3. **Page « Track my order »** — intégrer la vue de suivi en direct sur pppmtl.com (pilote), alimentée par les événements TR4CKER ; modèle réutilisable ensuite sur tous les sites de restaurants TAKATAK.
4. **Module dashboard V1** — créer la section TR4CKER dans le dashboard TAKATAK V1 : configuration Master → Brand → Group → Store, chauffeurs et téléphones, livraisons en cours, historique, gestion des paliers par client.
5. **Pourboires (palier 100 $)** — brancher le suivi des pourboires : association pourboire ↔ livraison ↔ chauffeur, historique et rapports par période dans le dashboard.
6. **Paiement NFC (palier 150 $)** — intégrer le paiement sans contact sur le téléphone du chauffeur via l'API Clover et le webhook de la passerelle : montant tiré du POS, confirmation en temps réel, commande marquée payée dans Clover.
7. **Comptabilité (palier 150 $)** — connecter les événements TR4CKER (livraisons, pourboires, paiements) à **4CCOUNTING BY TAKATAK** : écritures automatiques, aucune ressaisie.
8. **Interconnexions suite** — vérifier et documenter chaque lien de la section 5 : Food Hub (commandes), ON2GO (canal pilote), REW4RD (carte-cadeau et points → Google Wallet sur tous les sites), sites clients (suivi), Clover Marketplace (publication de l'application).
9. **Fiche Clover Marketplace** — préparer le dossier de publication de TR4CKER comme application Clover Marketplace : description, paliers 50 $ / 100 $ / 150 $, captures, conditions (site TAKATAK + intégrations Clover livraison requis).
10. **Flux post-livraison « Add tip + Review »** — brancher sur le **système d'avis existant** (widget `takatak-reviews.js`, dépôt `takatakca/takatak-v1` ; consolidation dans `takatakca/TAKATAKREVIEW`) : pop-up « Add tip » à la livraison complétée, page checkout combinant pourboire (→ palier 100 $) et avis (note + commentaire), **routage intelligent** — positif vers l'avis Google de l'entreprise, négatif vers le traitement interne au dashboard avec commentaire conservé. Même écran de fin de suivi sur pppmtl.com et tous les sites (voir issue nº 16).
11. **Documentation continue** — chaque avancement réel est consigné : nouvelle version datée de cette spécification, note au dossier Clover POS et au dossier de la marque pilote (PPP), et commentaire dans l'issue nº 17 tant que le dépôt dédié n'existe pas.

---

*Spécification rédigée le 2026-10-27 à partir des directives du propriétaire (Matt, TAKATAK Marketing) des 2026-10-27 03:30, 03:37, 03:46 et 03:52. Remplace et complète le concept du 2026-10-27 03:38 : développement 100 % maison (pas de compagnie tierce), modèle par paliers 50 $ / 100 $ / 150 $ et flux post-livraison « Add tip + Review » branché sur le système d'avis existant.*
