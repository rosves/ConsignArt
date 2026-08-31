# ConsignArt — Documentation technique

---

## Sommaire

1. [Résumé du projet](#1-résumé-du-projet)
2. [Lancement du projet](#2-lancement-du-projet)
3. [Authentification](#3-authentification)
4. [Administration](#4-administration)
5. [Artistes](#5-artistes)
6. [Œuvres](#6-œuvres)
7. [Expositions & Prêts](#7-expositions--prêts)
8. [Ventes](#8-ventes)
9. [Rapports](#9-rapports)
10. [Format des réponses](#10-format-des-réponses)
11. [Logging](#11-logging)
12. [Connexion à la base de données](#12-connexion-à-la-base-de-données)
13. [Règles métier](#13-règles-métier)
14. [Les entités](#14-les-entités)
15. [Choix techniques importants](#15-choix-techniques-importants)
16. [Tests](#16-tests)
17. [Structure des fichiers](#17-structure-des-fichiers)
18. [Variables d'environnement](#18-variables-denvironnement)
19. [Guide Swagger — Exemples de Payloads JSON](#19-guide-swagger--exemples-de-payloads-json-pour-chaque-route)

---

## 1. Résumé du projet

ConsignArt est une API REST B2B destinée aux galeries d'art contemporain pour gérer la **consignation d'œuvres d'art**.

### Le métier de la consignation

Un artiste confie une ou plusieurs œuvres à une galerie. La galerie expose et vend ces œuvres pour le compte de l'artiste. Sur chaque vente, la galerie prélève une commission et reverse le solde à l'artiste.

### Stack technique

- **Backend** : NestJS (Node.js)
- **Base de données** : PostgreSQL (via Docker en production)
- **ORM** : TypeORM
- **Auth** : JWT (access token + refresh token) stockés en cookies HTTP-only
- **Validation** : class-validator + class-transformer
- **Tests** : Jest
- **Conteneurisation** : Docker + docker-compose

### Les 4 rôles utilisateurs

| Rôle | Description |
|------|-------------|
| `ADMIN` | Gère la plateforme, valide les comptes galerie, approuve les transferts d'artistes, consulte les statistiques globales |
| `GALLERY` | Enregistre des artistes, dépose des œuvres, organise des expositions, gère les prêts, vend des œuvres |
| `ARTIST` | Consulte ses œuvres et ses revenus (compte optionnel) |
| `COLLECTOR` | Consulte le catalogue et achète des œuvres |

---

## 2. Lancement du projet

```bash
# 1. Copier le fichier d'environnement et remplir les variables
cp .env.example .env

# 2. Lancer le projet (API + PostgreSQL + Adminer)
docker compose up --build
```

- API disponible sur `http://localhost:3000/api/v1`
- Documentation Swagger disponible sur `http://localhost:3000/api/docs`
- Adminer (interface BDD) disponible sur `http://localhost:8080`

> ⚠️ Le compte `ADMIN` ne peut pas s'inscrire via l'API. Il doit être créé directement en base avec `role = admin` et `isActive = true` via Adminer.

---

## 3. Authentification

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/auth/register` | Public | Inscription |
| POST | `/api/v1/auth/login` | Public | Connexion |
| POST | `/api/v1/auth/refreshToken` | Authentifié | Renouveler les tokens |
| POST | `/api/v1/auth/logout` | Authentifié | Déconnexion |

### Exemple d'inscription

```json
POST /api/v1/auth/register
{
  "email": "gallery@test.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "gallery"
}
```

> ⚠️ Rôles acceptés à l'inscription : `gallery`, `artist`, `collector`. Le rôle `admin` est bloqué.
> ⚠️ Les comptes `GALLERY` ont `isActive = false` à la création — un `ADMIN` doit les valider.
> ✅ Les comptes `ARTIST` et `COLLECTOR` sont actifs immédiatement.
> ✅ L'email est automatiquement normalisé en minuscule via `NormalizeEmailPipe`.

### Fonctionnement des tokens JWT

- **Access token** : durée courte (15min) — utilisé pour accéder aux routes protégées
- **Refresh token** : durée longue (7j) — utilisé pour renouveler l'access token sans se reconnecter
- Les deux tokens sont stockés en **cookies HTTP-only** → inaccessibles par JavaScript (protection XSS)
- Le refresh token est **haché avec bcrypt en base** → protection en cas de fuite BDD
- **Refresh token rotation** : à chaque appel de `/refreshToken`, l'ancien token est invalidé et un nouveau est généré

### Fonctionnement des guards

- **JwtGuard** : appliqué **globalement** sur toutes les routes. Vérifie la validité du cookie `accessToken`.
- **@Public()** : décorateur à placer sur une route pour la rendre publique (ex: register, login).
- **RolesGuard** : appliqué **globalement**, vérifie que le rôle de l'utilisateur connecté correspond au(x) rôle(s) requis par la route.
- **@Roles(UserRole.ADMIN)** : décorateur à placer sur une route pour restreindre l'accès à un ou plusieurs rôles.
- **OwnershipGuard** : vérifie qu'une œuvre appartient bien à la galerie de l'utilisateur connecté (`GALLERY`) avant modification ou suppression (`ADMIN` contourne la restriction).
- **@CurrentUser()** : décorateur de paramètre pour accéder à l'utilisateur connecté dans un controller (`req.user`).

```typescript
// Exemple d'utilisation
@Get('profile')
@Roles(UserRole.GALLERY, UserRole.ARTIST)
getProfile(@CurrentUser() user: UserType) {
  return user;
}
```

---

## 4. Administration

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/admin/users/:id/activate` | ADMIN | Activer un compte galerie |

### Activer un compte galerie

Un compte `GALLERY` est inactif à sa création. Un `ADMIN` doit l'activer manuellement.

```
POST /api/v1/admin/users/32814a22-d6d6-4c7e-8a91-a3ce3a222604/activate
```

Règles :
- L'utilisateur doit exister → sinon `404 Not Found`
- L'utilisateur doit avoir le rôle `GALLERY` → sinon `400 Bad Request`
- Le compte ne doit pas être déjà actif → sinon `400 Bad Request`

---

## 5. Artistes

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/artists` | GALLERY | Créer un artiste |
| GET | `/api/v1/artists` | Authentifié | Lister les artistes de sa galerie |
| GET | `/api/v1/artists/:id` | Authentifié | Consulter un artiste par ID |
| PATCH | `/api/v1/artists/:id` | GALLERY | Modifier un artiste |
| PATCH | `/api/v1/artists/:id/status` | GALLERY | Changer le statut (ACTIVE / INACTIVE) |
| POST | `/api/v1/artists/:id/transfer` | ADMIN | Transférer un artiste vers une autre galerie |
| DELETE | `/api/v1/artists/:id` | GALLERY / ADMIN | Supprimer un artiste |

### Exemple de création d'artiste

```json
POST /api/v1/artists
{
  "firstName": "Claude",
  "lastName": "Monet",
  "biography": "Peintre impressionniste français.",
  "portfolioURL": "https://monet-art.com",
  "nationality": "Française",
  "enterAt": "2026-01-15T00:00:00.000Z"
}
```

Règles métier :
- L'artiste est rattaché automatiquement à la galerie de l'utilisateur connecté.
- Un artiste n'appartient qu'à une seule galerie à la fois.
- Seul un rôle `ADMIN` peut approuver le transfert d'un artiste vers une nouvelle galerie via `/artists/:id/transfer`.

---

## 6. Œuvres

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/artworks` | GALLERY / ADMIN | Déposer une œuvre en consignation |
| GET | `/api/v1/artworks` | Public | Consulter le catalogue (filtre par status/artistId) |
| GET | `/api/v1/artworks/:id` | Public | Consulter les détails d'une œuvre avec historique |
| PATCH | `/api/v1/artworks/:id/status` | GALLERY / ADMIN | Changer le statut d'une œuvre |
| DELETE | `/api/v1/artworks/:id` | GALLERY / ADMIN | Supprimer une œuvre (OwnershipGuard) |

### Exemple de dépôt d'œuvre

```json
POST /api/v1/artworks
{
  "title": "Nymphéas",
  "description": "Peinture à l'huile sur toile",
  "creationYear": 1914,
  "technic": "oil",
  "dimensions": { "height": 200, "width": 200, "depth": 5 },
  "sellPrice": 1500000,
  "reservePrice": 1200000,
  "artistId": "uuid-de-l-artiste"
}
```

> ⚠️ `sellPrice` et `reservePrice` sont en **centimes** (1 500 000 = 15 000€) et `sellPrice >= reservePrice`.
> ⚠️ Le pipe `MaxActiveArtworksPipe` bloque la création si l'artiste compte déjà **50 œuvres actives** (`AVAILABLE` ou `ON_LOAN`).

### Traçabilité et historique (`ArtworkStatusHistory`)

Chaque changement de statut génère automatiquement une ligne immuable dans `ArtworkStatusHistory` (append-only) :
```
AVAILABLE ──→ ON_LOAN   (exposition ou prêt)
ON_LOAN   ──→ AVAILABLE (fin d'exposition ou retour de prêt)
AVAILABLE ──→ SOLD      (vente)
SOLD      ──→ RETURNED  (retour exceptionnel, ADMIN uniquement)
```

---

## 7. Expositions & Prêts

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/exhibitions` | GALLERY / ADMIN | Créer une exposition |
| GET | `/api/v1/exhibitions` | Public | Lister les expositions |
| GET | `/api/v1/exhibitions/:id` | Public | Consulter une exposition par ID |
| PATCH | `/api/v1/exhibitions/:id` | GALLERY / ADMIN | Modifier une exposition |
| POST | `/api/v1/exhibitions/:id/close` | GALLERY / ADMIN | Clôturer une exposition |
| POST | `/api/v1/exhibitions/loans` | GALLERY / ADMIN | Enregistrer un prêt d'œuvre |
| POST | `/api/v1/exhibitions/loans/:id/return` | GALLERY / ADMIN | Retourner un prêt |

### Exemple de création d'exposition

```json
POST /api/v1/exhibitions
{
  "name": "Rétrospective Impressionnisme",
  "startDate": "2026-09-01T00:00:00.000Z",
  "endDate": "2026-10-31T00:00:00.000Z",
  "location": "Paris - Grand Palais",
  "type": "physical",
  "artworkIds": ["uuid-œuvre-1", "uuid-œuvre-2"]
}
```

Fonctionnement métier :
- Les œuvres sélectionnées doivent être au statut `AVAILABLE`.
- Lors de la création, les œuvres basculent automatiquement au statut `ON_LOAN` dans une **transaction TypeORM atomique**.
- Lors de la clôture (`/close`), toutes les œuvres concernées sont automatiquement restituées au statut `AVAILABLE`.

---

## 8. Ventes

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| POST | `/api/v1/sales` | GALLERY | Créer un contrat de vente |

### Créer une vente

```json
POST /api/v1/sales
{
  "artworkId": "uuid-de-l-oeuvre",
  "buyerId": "uuid-du-collectionneur",
  "salePrice": 1000000
}
```

> ⚠️ `salePrice` est en **centimes** (1 000 000 = 10 000€).
> ⚠️ Seule une `GALLERY` peut créer une vente.

Règles métier appliquées :
- L'œuvre doit exister → sinon `404 Not Found`
- L'œuvre doit être au statut `AVAILABLE` → sinon `422 Unprocessable Entity`
- Le prix de vente doit être ≥ au prix de réserve → sinon `422 Unprocessable Entity`
- Le prix de vente doit être > 0 → sinon `400 Bad Request` (via `SalePriceValidationPipe`)

La vente se fait dans une **transaction TypeORM atomique** :
1. Créer la `Sale` avec commission calculée
2. Passer l'`Artwork` en `SOLD`
3. Créer un `ArtworkStatusHistory`
→ Si une étape échoue, tout est annulé (rollback)

### Calcul de la commission

```
Prix ≤ 5 000€            → commission = 40%
5 000€ < prix ≤ 20 000€  → commission = 35%
Prix > 20 000€           → commission = 30%

Montant artiste = prix de vente - commission
```

### BusinessRuleViolationFilter

Les violations de règles métier (prix sous le prix de réserve, œuvre non disponible) sont gérées par `BusinessRuleViolationFilter` — un filtre NestJS personnalisé qui attrape les `BusinessRuleException` et retourne une réponse formatée avec le code HTTP `422 Unprocessable Entity`.

```json
{
  "statusCode": 422,
  "message": "Sale price is below reserve price",
  "timestamp": "2026-08-30T01:00:00Z"
}
```

---

## 9. Rapports

### Routes disponibles

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| GET | `/api/v1/reports/artist` | ARTIST | Stats de l'artiste connecté |
| GET | `/api/v1/reports/gallery` | GALLERY | Stats de la galerie connectée |
| GET | `/api/v1/reports/admin` | ADMIN | Stats globales de la plateforme |

### Stats artiste

```json
GET /api/v1/reports/artist
{
  "totalSales": 2000000,
  "totalCommissions": 700000,
  "salesCount": 3,
  "availableArtworks": 12
}
```

### Stats galerie

```json
GET /api/v1/reports/gallery
{
  "salesStats": [
    { "month": "2026-08-01T00:00:00Z", "totalRevenue": "5000000", "totalSales": "3" }
  ],
  "topArtists": [
    { "artistId": "uuid", "firstName": "Jean", "lastName": "Dupont", "totalSales": "3000000" }
  ]
}
```

### Stats admin

```json
GET /api/v1/reports/admin
{
  "activeUsers": 42,
  "totalTransactions": 150,
  "totalVolume": 50000000,
  "totalCommissions": 17500000
}
```

---

## 10. Format des réponses

Toutes les réponses sont formatées de façon uniforme par le `ResponseInterceptor`.

**Succès :**
```json
{
  "data": { ... },
  "meta": {
    "statusCode": 200,
    "path": "/api/v1/auth/login"
  },
  "timestamp": "2026-08-13T13:02:20Z"
}
```

**Erreur :**
```json
{
  "statusCode": 401,
  "message": "Wrong Email or Password !",
  "timestamp": "2026-08-13T13:02:20Z",
  "path": "/api/v1/auth/login"
}
```

---

## 11. Logging

Chaque requête (succès et erreur) est automatiquement enregistrée par le `LoggingInterceptor`.

**Fichier de log** : `logs/requests.log` à la racine du projet.
- Le dossier `logs/` est créé automatiquement au démarrage s'il n'existe pas.
- Les fichiers `.log` sont ignorés par Git (`.gitignore`), seul le dossier est versionné via `.gitkeep`.

**Format des logs :**
```
[2026-08-13T13:02:20Z] POST /api/v1/auth/login - SUCCESS - user-id - 45ms
[2026-08-13T13:02:20Z] POST /api/v1/auth/login - ERROR - anonymous - 12ms - Wrong Email or Password !
```

---

## 12. Connexion à la base de données

La connexion se fait dans `app.module.ts` via `TypeOrmModule.forRootAsync`.

`forRootAsync` permet de charger la configuration de façon **asynchrone** — on attend que `ConfigService` ait fini de lire le `.env` avant de se connecter. La configuration est centralisée dans `src/common/config/configurations/database.config.ts`.

Options clés :
- **`type`** : type de BDD (`postgres`)
- **`host`, `port`, `username`, `password`, `database`** : options de connexion lues depuis le `.env`
- **`entities`** : liste des entités TypeORM → définit les tables à créer. ⚠️ Une entité doit être décorée avec `@Entity()` et `@PrimaryGeneratedColumn()` pour que la table soit créée en base.
- **`synchronize: true`** : synchronise automatiquement la BDD avec les entités au démarrage. ⚠️ **Ne jamais utiliser en production** — utiliser les migrations à la place.
- **`logging: true`** : affiche toutes les requêtes SQL dans le terminal (dev uniquement).

### Migrations

Les migrations TypeORM sont configurées dans `src/database/data-source.ts`.

```bash
npm run migration:generate src/database/migrations/<NomMigration>  # générer
npm run migration:run                                               # appliquer
npm run migration:revert                                            # annuler
```

### Configuration des variables d'environnement

Les variables sont chargées via `@nestjs/config` avec des **namespaces** :

```typescript
configService.get('database.host')   // DB_HOST
configService.get('jwt.secret')      // JWT_SECRET
configService.get('app.port')        // PORT
```

La validation des variables est faite au démarrage dans `src/common/config/validations/env.validation.ts` — si une variable obligatoire est manquante, l'app refuse de démarrer.

---

## 13. Règles métier

### Utilisateurs

- Un compte `GALLERY` est **inactif** (`isActive = false`) à la création.
  Un `ADMIN` doit le valider avant que la galerie puisse accéder à la plateforme.
- Les autres rôles (`ARTIST`, `COLLECTOR`) sont actifs dès l'inscription.
- Les mots de passe sont hashés avec **bcrypt** — jamais stockés en clair.
- L'email est **normalisé en minuscule** automatiquement via `NormalizeEmailPipe`.
- Le rôle `ADMIN` ne peut pas être créé via l'API — uniquement directement en base.

### Artistes

- Un artiste n'appartient qu'à **une seule galerie** à la fois.
- Un artiste peut être **transféré** vers une autre galerie avec l'accord d'un admin
  (on met à jour `galleryId` et `enterAt`).
- Un artiste ne peut pas avoir plus de **50 œuvres actives** simultanément
  dans une galerie (vérifié dans le pipe `MaxActiveArtworksPipe`).

### Œuvres

- Une œuvre ne peut pas être **vendue en dessous de son prix de réserve**
  (`sellPrice >= reservePrice`).
- Une œuvre au statut `ON_LOAN` **ne peut pas être vendue**.
- Une œuvre au statut `SOLD` **ne peut plus changer de statut**.
- Tout changement de statut crée un enregistrement dans `ArtworkStatusHistory`.
- La suppression ou modification d'une œuvre est sécurisée par `OwnershipGuard` qui s'assure qu'elle appartient bien à la galerie connectée.

```
AVAILABLE ──→ ON_LOAN   (ajout à une exposition ou prêt)
ON_LOAN   ──→ AVAILABLE (fin d'exposition ou retour de prêt)
AVAILABLE ──→ SOLD      (vente)
SOLD      ──→ RETURNED  (retour exceptionnel, géré par admin)
```

### Ventes

```
Prix ≤ 5 000€            → commission = 40%
5 000€ < prix ≤ 20 000€  → commission = 35%
Prix > 20 000€           → commission = 30%

Montant artiste = prix de vente - commission
```

Une vente se fait dans une **transaction TypeORM** :
1. Créer la `Sale`
2. Passer l'`Artwork` en `SOLD`
3. Créer un `ArtworkStatusHistory`
→ Si une étape échoue, tout est annulé (rollback)

### Expositions

- Une exposition doit contenir **au moins une œuvre** à la création.
- À la création, les œuvres sélectionnées passent en `ON_LOAN` dans une transaction atomique.
- Une œuvre `ON_LOAN` **ne peut pas être vendue** pendant l'exposition.
- À la clôture de l'exposition, toutes les œuvres sont automatiquement restituées au statut `AVAILABLE`.

### Prêts

- On ne peut pas prêter une œuvre déjà au statut `ON_LOAN`.
- Quand l'œuvre revient, on enregistre `returnedAt` et on repasse l'œuvre en `AVAILABLE`.

### Rapports

| Destinataire | Données exposées |
|-------------|-----------------|
| `GALLERY` | Œuvres vendues par mois, CA total, top 5 artistes, taux de rotation |
| `ARTIST` | Total des ventes, commissions versées, œuvres disponibles |
| `ADMIN` | Utilisateurs actifs, volume de transactions, commissions totales |

---

## 14. Les entités

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

### `User` — Identité et authentification

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | identifiant unique |
| `email` | varchar unique | identifiant de connexion |
| `password` | varchar | haché avec bcrypt, jamais en clair |
| `firstName` | varchar | prénom |
| `lastName` | varchar | nom |
| `role` | enum | ADMIN / GALLERY / ARTIST / COLLECTOR |
| `isActive` | boolean (false) | false par défaut pour GALLERY, true pour les autres |
| `hashedRefreshToken` | varchar nullable | refresh token haché, null après logout |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

### `Artist` — Fiche métier de l'artiste

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `firstName` / `lastName` | varchar | |
| `biography` | text nullable | |
| `portfolioURL` | varchar nullable | |
| `nationality` | varchar nullable | |
| `enterAt` | date | date d'entrée dans la galerie actuelle |
| `status` | enum | ACTIVE / INACTIVE |
| `galleryId` | uuid nullable (FK → User) | galerie qui gère cet artiste |
| `userAccountId` | uuid nullable (FK → User) | compte de connexion optionnel |

### `Artwork` — L'œuvre d'art

| Champ | Type | Description |
|-------|------|-------------|
| `id` | uuid | |
| `title` | varchar | |
| `technique` | enum | OIL / PHOTOGRAPHY / SCULPTURE / ... |
| `dimensions` | jsonb nullable | `{ height, width, depth? }` en cm |
| `sellPrice` | int | prix en **centimes** |
| `reservePrice` | int | prix plancher en **centimes** |
| `status` | enum | AVAILABLE / ON_LOAN / SOLD / RETURNED |
| `consignedAt` | timestamptz | date de dépôt en consignation |
| `artistId` | uuid (FK → Artist) | |

### `ArtworkStatusHistory` — Journal des statuts

Table **append-only** : INSERT uniquement, jamais d'UPDATE ni de DELETE.

| Champ | Type | Description |
|-------|------|-------------|
| `artworkId` | uuid (FK → Artwork) | |
| `fromStatus` | enum nullable | statut avant (null = création) |
| `toStatus` | enum | statut après |
| `reason` | varchar nullable | motif du changement |
| `changedById` | uuid nullable | null si changement automatique |

### `Sale` — Contrat de vente

Table **immuable** : pas d'`updatedAt`. Une vente ne se modifie jamais.

| Champ | Type | Description |
|-------|------|-------------|
| `artworkId` | uuid unique | une œuvre vendue une seule fois |
| `buyerId` | uuid (FK → User COLLECTOR) | |
| `salePrice` | int | prix final en **centimes**, figé à la vente |
| `commissionRate` | decimal | taux appliqué (30, 35 ou 40), figé |
| `commissionAmount` | int | montant galerie en **centimes**, figé |
| `artistAmount` | int | montant artiste en **centimes**, figé |
| `soldAt` | timestamptz | date/heure exacte de la vente |

### `Exhibition` et `Loan`

- `Exhibition` : exposition organisée par une galerie, liée à des œuvres via `@ManyToMany` (table de jointure `exhibition_artworks` créée automatiquement par TypeORM).
- `Loan` : prêt d'une œuvre à une galerie **externe**. `returnedAt = null` signifie que le prêt est actif.

---

## 15. Choix techniques importants

### UUID pour tous les IDs
Non-prédictible, non-énumérable. Un entier expose le volume et permet l'énumération des ressources.

### Prix en centimes
```
// ❌ float → problèmes de précision
price: 5000.10  → peut donner 5000.09999... en mémoire

// ✅ centimes → entier exact
price: 500010
```
Conversion en euros uniquement à l'affichage (`valeur / 100`).

### Montants figés dans Sale
`salePrice`, `commissionRate`, `commissionAmount` et `artistAmount` sont stockés directement dans `Sale`. Le prix d'une œuvre peut changer après la vente — les données financières doivent être figées au moment de la transaction.

### ManyToMany automatique pour Exhibition ↔ Artwork
On utilise `@ManyToMany()` + `@JoinTable()` de TypeORM. La table `exhibition_artworks` est générée automatiquement par la migration.

### Séparation DTO public / DTO interne
- `CreateUserDTO` → données saisies par l'utilisateur via l'API (email, password, firstName, lastName, role)
- `CreateUserInternalDTO` → étend `CreateUserDTO` avec les champs système (`isActive`) — utilisé uniquement en interne dans les services

### Transaction atomique pour les ventes et expositions
La vente et la création d'exposition utilisent `EntityManager.transaction()` de TypeORM. Les opérations associées sont atomiques — si l'une échoue, toutes sont annulées (rollback).

### BusinessRuleViolationFilter
Sépare les erreurs métier (`422`) des erreurs de validation DTO (`400`). Permet un traitement différencié des deux types d'erreur côté client.

---

## 16. Tests

```bash
npm run test       # lance tous les tests
npm run test:cov   # avec rapport de couverture
```

| Type | Fichier | Ce qui est testé |
|------|---------|-----------------|
| Unitaire | `auth/auth.service.spec.ts` | register (email déjà existant), login (user non trouvé, mauvais password, succès) |
| Unitaire | `common/guards/role.guard.spec.ts` | pas de rôle requis, bon rôle, mauvais rôle |
| Intégration | `auth/auth.integration.spec.ts` | POST /auth/login → 401, POST /auth/login → 200 + cookies |
| Unitaire | `artists/artists.service.spec.ts` | CRUD artiste, rattachement galerie, transfert admin et suppression |
| Unitaire | `artworks/artworks.service.spec.ts` | création avec historique initial, transitions de statuts, suppression |
| Unitaire | `exhibitions/exhibitions.service.spec.ts` | création expo, clôture avec retour d'œuvres, gestion des prêts |
| Unitaire | `common/guards/ownership.guard.spec.ts` | validation d'accès Galerie propriétaire vs Galerie tierce vs Admin |
| Unitaire | `common/pipes/max-active-artworks.pipe.spec.ts` | validation du quota (50 œuvres max par artiste) |
| Unitaire | `sales/sales.service.spec.ts` | calcul commission (40/35/30%), montant artiste |
| Unitaire | `sales/pipes/sale-price-validation.pipe.spec.ts` | validation prix > 0 |
| Intégration | `sales/sales.integration.spec.ts` | POST /sales → 201, POST /sales → 400 |

---

## 17. Structure des fichiers

```
src/
├── common/
│   ├── config/
│   │   ├── configurations/      ← app.config.ts, database.config.ts, jwt.config.ts
│   │   ├── validations/         ← env.validation.ts (validation au démarrage)
│   │   └── config.module.ts
│   ├── decorators/              ← @Public(), @Roles(), @CurrentUser()
│   ├── enums/                   ← tous les enums centralisés
│   ├── filters/                 ← GlobalExceptionFilter, BusinessRuleViolationFilter
│   ├── guards/                  ← JwtGuard, RoleGuard, OwnershipGuard
│   ├── interceptors/            ← LoggingInterceptor, ResponseInterceptor
│   ├── pipes/                   ← NormalizeEmailPipe, MaxActiveArtworksPipe, SalePriceValidationPipe
│   └── value-objects/           ← Dimensions (JSONB)
├── entities/                    ← toutes les entités TypeORM (barrel export via index.ts)
├── auth/                        ← register, login, refresh, logout
│   ├── strategy/                ← JwtStrategy (lit le cookie accessToken)
│   ├── type/                    ← JwtPayload, UserType
│   └── dto/                     ← CreateUserDTO, LoginDTO
├── users/                       ← findByEmail, findById, create, updateRefreshToken
│   └── dto/                     ← CreateUserDTO, CreateUserInternalDTO
├── artists/                     ← CRUD artistes, rattachement galerie, transfert admin
│   └── dto/                     ← CreateArtistDto, UpdateArtistDto, TransferArtistDto
├── artworks/                    ← CRUD œuvres, statuts, historique ArtworkStatusHistory
│   └── dto/                     ← CreateArtworkDto, ChangeArtworkStatusDto
├── exhibitions/                 ← expositions, prêts inter-galeries
│   └── dto/                     ← CreateExhibitionDto, UpdateExhibitionDto, CreateLoanDto
├── admin/                       ← activation des comptes galerie
├── sales/                       ← contrat de vente, commission, transaction
│   ├── dto/                     ← CreateSaleDto
│   └── pipes/                   ← SalePriceValidationPipe
├── reports/                     ← stats galerie, artiste, admin
├── database/
│   ├── data-source.ts           ← config TypeORM CLI pour migrations
│   └── migrations/              ← InitialSchema
└── logs/
    ├── .gitkeep                 ← dossier versionné
    └── requests.log             ← créé automatiquement, ignoré par Git
```

---

## 18. Variables d'environnement

Voir `.env.example` pour la liste complète. Les variables sont validées au démarrage — l'app refuse de lancer si une variable obligatoire est manquante.

| Variable | Obligatoire | Défaut | Description |
|----------|-------------|--------|-------------|
| `NODE_ENV` | Non | `development` | Environnement |
| `PORT` | Non | `3000` | Port de l'API |
| `DB_HOST` | Oui | — | Host PostgreSQL |
| `DB_PORT` | Non | `5432` | Port PostgreSQL |
| `DB_USERNAME` | Oui | — | Utilisateur PostgreSQL |
| `DB_PASSWORD` | Oui | — | Mot de passe PostgreSQL |
| `DB_DATABASE` | Oui | — | Nom de la base de données |
| `JWT_SECRET` | Oui | — | Secret pour les access tokens |
| `JWT_EXPIRES_IN` | Non | `15m` | Durée des access tokens |
| `JWT_REFRESH_SECRET` | Oui | — | Secret pour les refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | Non | `7d` | Durée des refresh tokens |

---

## 19. Guide Swagger — Exemples de Payloads JSON pour chaque route

Tous les exemples ci-dessous sont pré-configurés dans la documentation Swagger (`http://localhost:3000/api/docs`). Vous pouvez directement les copier-coller dans Swagger UI en cliquant sur **"Try it out"**.

### A. Authentification (`/api/v1/auth`)

#### Inscription Galerie : `POST /api/v1/auth/register`
```json
{
  "email": "galerie.louvre@consignart.com",
  "password": "Password123!",
  "firstName": "Galerie",
  "lastName": "Du Louvre",
  "role": "gallery"
}
```

#### Connexion Galerie : `POST /api/v1/auth/login`
```json
{
  "email": "galerie.louvre@consignart.com",
  "password": "Password123!"
}
```

---

### B. Artistes (`/api/v1/artists`)

#### Créer un artiste : `POST /api/v1/artists`
```json
{
  "firstName": "Claude",
  "lastName": "Monet",
  "biography": "Peintre impressionniste français.",
  "portfolioURL": "https://monet-art.com",
  "nationality": "Française",
  "enterAt": "2026-01-15T00:00:00.000Z"
}
```

#### Modifier un artiste : `PATCH /api/v1/artists/{id}`
```json
{
  "biography": "Nouvelle biographie mise à jour pour Monet.",
  "nationality": "Française (Maître Impressionniste)"
}
```

#### Changer le statut d'un artiste : `PATCH /api/v1/artists/{id}/status`
```json
{
  "status": "inactive"
}
```

#### Transférer un artiste (Admin uniquement) : `POST /api/v1/artists/{id}/transfer`
```json
{
  "targetGalleryId": "COLLER_ICI_L_ID_DE_LA_NOUVELLE_GALERIE",
  "enterAt": "2026-09-01T00:00:00.000Z"
}
```

---

### C. Œuvres (`/api/v1/artworks`)

#### Déposer une œuvre : `POST /api/v1/artworks`
*(Remplacez `"artistId"` par l'ID de l'artiste créé).*

```json
{
  "title": "Nymphéas",
  "description": "Peinture à l'huile emblématique sur toile.",
  "creationYear": 1914,
  "technic": "oil",
  "dimensions": {
    "height": 200,
    "width": 200,
    "depth": 5
  },
  "sellPrice": 1500000,
  "reservePrice": 1200000,
  "imageURL": "https://example.com/nympheas.jpg",
  "artistId": "COLLER_ICI_L_ID_DE_L_ARTISTE"
}
```

#### Changer le statut d'une œuvre : `PATCH /api/v1/artworks/{id}/status`
*(Statuts autorisés : `"available"`, `"on_loan"`, `"sold"`, `"returned"`).*
```json
{
  "toStatus": "on_loan",
  "reason": "Prêt temporaire pour exposition de rentrée"
}
```

---

### D. Expositions & Prêts (`/api/v1/exhibitions`)

#### Créer une exposition : `POST /api/v1/exhibitions`
*(Remplacez les IDs dans `artworkIds` par ceux d'œuvres au statut `available`).*

```json
{
  "name": "Les Maîtres de l Impressionnisme",
  "startDate": "2026-09-01T00:00:00.000Z",
  "endDate": "2026-10-31T00:00:00.000Z",
  "location": "Paris - Grand Palais",
  "type": "physical",
  "description": "Une exposition rétrospective majeure.",
  "artworkIds": [
    "COLLER_ICI_L_ID_DE_L_OEUVRE"
  ]
}
```

#### Enregistrer un prêt inter-galeries : `POST /api/v1/exhibitions/loans`
```json
{
  "artworkId": "COLLER_ICI_L_ID_DE_L_OEUVRE",
  "borrowerGalleryId": "COLLER_ICI_L_ID_DE_LA_GALERIE_EMPRUNTEUSE",
  "startDate": "2026-11-01T00:00:00.000Z",
  "endDate": "2026-12-31T00:00:00.000Z",
  "conditions": "Assurance tous risques et transport spécialisé sous température contrôlée."
}
```

---

### E. Ventes (`/api/v1/sales`)

#### Créer une vente : `POST /api/v1/sales`
```json
{
  "artworkId": "COLLER_ICI_L_ID_DE_L_OEUVRE",
  "buyerId": "COLLER_ICI_L_ID_DU_COLLECTEUR",
  "salePrice": 1500000
}
```