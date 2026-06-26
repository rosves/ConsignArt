# ConsignArt — Documentation technique

---

## 1. Résumé du projet

ConsignArt est une API REST B2B destinée aux galeries d'art contemporain
pour gérer la **consignation d'œuvres d'art**.

### Le métier de la consignation

Un artiste confie une ou plusieurs œuvres à une galerie. La galerie expose
et vend ces œuvres pour le compte de l'artiste. Sur chaque vente, la galerie
prélève une commission et reverse le solde à l'artiste.

### Stack technique

- **Backend** : NestJS (Node.js)
- **Base de données** : PostgreSQL (via Docker en production)
- **ORM** : TypeORM
- **Auth** : JWT (access token + refresh token)
- **Validation** : class-validator + class-transformer
- **Tests** : Vitest
- **Conteneurisation** : Docker + docker-compose

### Les 4 rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `ADMIN` | Gère la plateforme, valide les comptes galerie, consulte les statistiques globales |
| `GALLERY` | Enregistre des artistes, dépose des œuvres, organise des expositions, vend |
| `ARTIST` | Consulte ses œuvres et ses revenus (compte optionnel) |
| `COLLECTOR` | Consulte le catalogue et achète des œuvres |

---

## 2. Règles métier

### Utilisateurs

- Un compte `GALLERY` est **inactif** (`isActive = false`) à la création.
  Un `ADMIN` doit le valider avant que la galerie puisse accéder à la plateforme.
- Les autres rôles (`ARTIST`, `COLLECTOR`) sont actifs dès l'inscription.
- Les mots de passe sont hashés avec **bcrypt** — jamais stockés en clair.

### Artistes

- Un artiste n'appartient qu'à **une seule galerie** à la fois.
- Un artiste peut être **transféré** vers une autre galerie avec l'accord d'un admin
  (on met à jour `galleryId` et `enterAt`).
- Un artiste peut avoir un compte `User` optionnel pour consulter ses données.
  Sans compte, c'est la galerie qui gère tout.
- Un artiste ne peut pas avoir plus de **50 œuvres actives** simultanément
  dans une galerie (vérifié dans un Pipe NestJS).

### Œuvres

- Une œuvre ne peut pas être **vendue en dessous de son prix de réserve**
  (`sellPrice >= reservePrice`).
- Une œuvre au statut `ON_LOAN` **ne peut pas être vendue**.
- Une œuvre au statut `SOLD` **ne peut plus changer de statut**.
- Tout changement de statut crée un enregistrement dans `ArtworkStatusHistory`.
- Les statuts possibles et leurs transitions :

```
AVAILABLE ──→ ON_LOAN   (ajout à une exposition ou prêt)
ON_LOAN   ──→ AVAILABLE (fin d'exposition ou retour de prêt)
AVAILABLE ──→ SOLD      (vente)
SOLD      ──→ RETURNED  (retour exceptionnel, géré par admin)
```

### Ventes

- La commission est calculée selon le prix de vente :

```
Prix ≤ 5 000€            → commission = 40%
5 000€ < prix ≤ 20 000€  → commission = 35%
Prix > 20 000€           → commission = 30%

Montant artiste = prix de vente - commission
```

- Une vente doit se faire dans une **transaction TypeORM** :
  1. Créer la `Sale`
  2. Passer l'`Artwork` en `SOLD`
  3. Créer un `ArtworkStatusHistory`
  → Si une étape échoue, tout est annulé (rollback)

- Une facture (`invoiceRef`) est générée pour l'acheteur.
- Un relevé de vente (`artistStatementRef`) est généré pour l'artiste.

### Expositions

- Une exposition doit contenir **au moins une œuvre** à la création.
- À la création, les œuvres sélectionnées passent en `ON_LOAN`.
- Une œuvre `ON_LOAN` **ne peut pas être vendue** pendant l'exposition.
- Une œuvre ne peut pas être ajoutée à une exposition si elle est déjà `ON_LOAN`.
- La relation Exhibition ↔ Artwork est un **ManyToMany géré automatiquement par TypeORM**
  via `@ManyToMany()` + `@JoinTable()`. La table de jointure `exhibition_artworks`
  sera créée automatiquement par la migration — pas besoin d'entité explicite.

### Prêts

- On ne peut pas prêter une œuvre déjà au statut `ON_LOAN`.
- Quand l'œuvre revient, on enregistre `returnedAt` et on repasse
  l'œuvre en `AVAILABLE`.

### Rapports

| Destinataire | Données exposées |
|-------------|-----------------|
| `GALLERY` | Œuvres vendues par mois, CA total, top 5 artistes, taux de rotation |
| `ARTIST` | Total des ventes, commissions versées, œuvres disponibles |
| `ADMIN` | Utilisateurs actifs, volume de transactions, commissions totales |

---

## 3. Les entités

### Vue d'ensemble des relations

```
User (GALLERY) ──< Artist ──< Artwork ──< ArtworkStatusHistory
                                 │
                                 ├──< Loan ──> User (GALLERY emprunteur)
                                 │
                                 └──>< Exhibition ──> User (GALLERY)
                                      (table de jointure créée automatiquement
                                       par TypeORM via @ManyToMany)

User (COLLECTOR) ──< Sale ──> Artwork
```

---

### `User` — Identité et authentification

Gère uniquement qui tu es et comment tu te connectes.
Ne contient pas de données métier spécifiques à un rôle.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | identifiant unique |
| `email` | varchar unique | identifiant de connexion |
| `password` | varchar | haché avec bcrypt, jamais en clair |
| `firstName` | varchar | prénom |
| `lastName` | varchar | nom |
| `role` | enum | ADMIN / GALLERY / ARTIST / COLLECTOR |
| `isActive` | boolean (false) | false par défaut, validation admin pour GALLERY |
| `hashedRefreshToken` | varchar nullable | pour la rotation JWT, null après logout |
| `createdAt` | timestamp | date de création |
| `updatedAt` | timestamp | date de dernière modification |

**Le collectionneur n'a pas d'entité séparée.**
Un collectionneur EST un `User` avec `role = COLLECTOR`. Sa trace dans le
système c'est uniquement dans `Sale.buyerId`. Il n'a pas de données métier propres.

---

### `Artist` — Fiche métier de l'artiste

Entité métier créée et gérée par une galerie.
Séparée de `User` car un artiste peut exister sans compte de connexion.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `firstName` | varchar | |
| `lastName` | varchar | |
| `biography` | text nullable | |
| `portfolioURL` | varchar nullable | |
| `nationality` | varchar nullable | |
| `enterAt` | date | date d'entrée dans la galerie actuelle |
| `status` | enum | ACTIVE / INACTIVE |
| `galleryId` | uuid (FK → User) | galerie qui gère cet artiste |
| `userAccountId` | uuid nullable (FK → User) | compte de connexion optionnel |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

### `Artwork` — L'œuvre d'art

Entité centrale du projet.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `title` | varchar | |
| `description` | text nullable | |
| `creationYear` | int | |
| `technique` | enum | OIL / PHOTOGRAPHY / SCULPTURE / ... |
| `dimensions` | jsonb nullable | `{ height, width, depth? }` en cm |
| `sellPrice` | int | prix en **centimes** |
| `reservePrice` | int | prix plancher en **centimes** |
| `status` | enum | AVAILABLE / ON_LOAN / SOLD / RETURNED |
| `imageURL` | varchar nullable | |
| `consignedAt` | timestamptz | date de dépôt en consignation |
| `artistId` | uuid (FK → Artist) | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

### `ArtworkStatusHistory` — Journal des statuts

Table **append-only** : INSERT uniquement, jamais d'UPDATE ni de DELETE.
Exigé dans le sujet pour tracer tous les changements de statut.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `artworkId` | uuid (FK → Artwork) | |
| `fromStatus` | enum nullable | statut avant (null = création) |
| `toStatus` | enum | statut après |
| `reason` | varchar nullable | ex: "Sold to collector", "Returned" |
| `changedById` | uuid nullable (FK → User) | null si changement automatique |
| `createdAt` | timestamp | |

---

### `Sale` — Contrat de vente

Table **immuable** : pas d'`updatedAt`. Une vente ne se modifie jamais.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `artworkId` | uuid unique (FK → Artwork) | unique = une œuvre vendue une seule fois |
| `buyerId` | uuid (FK → User COLLECTOR) | |
| `salePrice` | int | prix final en **centimes**, figé à la vente |
| `commissionRate` | decimal | taux appliqué (30, 35 ou 40), figé |
| `commissionAmount` | int | montant galerie en **centimes**, figé |
| `artistAmount` | int | montant artiste en **centimes**, figé |
| `soldAt` | timestamptz | date/heure exacte de la vente |
| `invoiceRef` | varchar nullable | référence facture acheteur |
| `artistStatementRef` | varchar nullable | référence relevé artiste |
| `createdAt` | timestamp | |

---

### `Exhibition` — Exposition

Organisée par une galerie, regroupe des œuvres via une relation ManyToMany.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `name` | varchar | |
| `startDate` | timestamptz | |
| `endDate` | timestamptz | |
| `location` | varchar nullable | lieu physique OU lien virtuel |
| `type` | enum | PHYSICAL / VIRTUAL |
| `description` | text nullable | |
| `galleryId` | uuid (FK → User GALLERY) | |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

**Relation avec Artwork :** gérée via `@ManyToMany()` + `@JoinTable()` dans TypeORM.
La table de jointure `exhibition_artworks(exhibitionId, artworkId)` est créée
automatiquement par la migration. Pas besoin d'entité séparée.

---

### `Loan` — Prêt d'une œuvre à une autre galerie

Différent d'une `Exhibition` : le prêt est vers une galerie **externe**.
Dans les deux cas, l'œuvre passe en `ON_LOAN`.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `artworkId` | uuid (FK → Artwork) | |
| `borrowingGalleryId` | uuid (FK → User GALLERY) | galerie qui emprunte |
| `startDate` | timestamptz | |
| `endDate` | timestamptz | fin prévue |
| `returnedAt` | timestamptz nullable | null = prêt actif |
| `conditions` | text nullable | conditions du prêt |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

---

## 4. Choix techniques importants

### UUID pour tous les IDs

On utilise des UUIDs au lieu d'entiers auto-incrémentés.

- Un entier expose le volume : si le dernier user est l'id `1042`, on sait qu'il y a ~1000 users.
- Un entier permet l'énumération : tester `/users/1`, `/users/2`...
- Un UUID est non-prédictible et ne révèle aucune information.

### Prix en centimes

Tous les prix sont stockés en **centimes d'euros** sous forme d'entier.

```
// ❌ Jamais ça
price: 5000.10  // float → peut donner 5000.09999... en mémoire

// ✅ Toujours ça
price: 500010   // centimes → entier exact
```

La conversion en euros se fait uniquement à l'affichage (`valeur / 100`).

### Pas de soft delete (sauf `isActive` sur User)

Le soft delete (`deletedAt`) a été intentionnellement retiré pour garder
le code simple et accessible à toute l'équipe.

À la place, on s'appuie sur les contraintes PostgreSQL :
- Si on essaie de supprimer un artiste qui a des œuvres → PostgreSQL refuse
- Si on essaie de supprimer une galerie qui a des artistes → PostgreSQL refuse

`isActive` sur `User` reste car c'est une vraie règle métier du sujet
(validation des comptes GALLERY par l'admin).

### Montants figés dans Sale

Dans `Sale`, on stocke `salePrice`, `commissionRate`, `commissionAmount`
et `artistAmount` directement. On ne les recalcule pas depuis `Artwork`.

Pourquoi ? Le prix d'une œuvre peut changer après la vente. Les données
financières doivent être **figées au moment de la transaction**.

### ManyToMany automatique pour Exhibition ↔ Artwork

On utilise le `@ManyToMany()` automatique de TypeORM au lieu d'une entité
de jointure explicite. La table `exhibition_artworks` sera générée par la migration.

Pourquoi ? Le sujet ne demande pas de données supplémentaires sur cette relation.
Le ManyToMany automatique est plus simple et suffisant.

### Pas de relations TypeORM dans les entités de base

Les entités ne déclarent pas encore `@ManyToOne`, `@OneToMany` etc.
Chaque développeur ajoutera les relations dont il a besoin dans son module.
Cela évite les imports circulaires au départ et garde les entités lisibles.

---

## 5. Structure des fichiers

```
src/
├── common/
│   ├── enums/
│   │   └── index.ts              ← tous les enums centralisés
│   └── value-objects/
│       └── dimensions.vo.ts      ← Value Object Dimensions
└── entities/
    ├── index.ts                  ← barrel export
    ├── user.entity.ts
    ├── artist.entity.ts
    ├── artwork.entity.ts
    ├── artwork-status-history.entity.ts
    ├── sale.entity.ts
    ├── exhibition.entity.ts
    └── loan.entity.ts
```s