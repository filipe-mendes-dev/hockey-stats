![Benchline Stats](docs/assets/github-banner.png)

# Benchline Stats

Benchline Stats is a web app for recording rink-hockey matches and analysing team and player performance. Manage squads, capture live events and review each game through statistics, rink maps and connected timelines.

[![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Mantine 9](https://img.shields.io/badge/Mantine-9-339AF0?logo=mantine&logoColor=white)](https://mantine.dev/)
[![TanStack Query 5](https://img.shields.io/badge/TanStack_Query-5-EF4444?logo=reactquery&logoColor=white)](https://tanstack.com/query/)
[![Dexie 4](https://img.shields.io/badge/Dexie-4-59666F)](https://dexie.org/)
[![Drizzle 0.45](https://img.shields.io/badge/Drizzle-0.45-40542E?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![Zustand 5](https://img.shields.io/badge/Zustand-5-665544)](https://zustand.docs.pmnd.rs/)

## Features

- **Players and teams.** Manage squads, player roles, jersey numbers and match call-ups.
- **Live recording.** Capture recoveries, ball losses, shots, saves, fouls, cards, substitutions and timeouts.
- **Match controls.** Track the score, clock and team powerplay, confirm each half's lineup and attack direction, and use corrections or latest-event Undo.
- **Post-match analysis.** Review team and player statistics, recorded playing time and event breakdowns by period.
- **Interactive match history.** Explore events through linked rink positions, player timelines and event lists.
- **Public sharing.** Share completed-match statistics through read-only links that can be revoked.
- **Offline recording.** Save events on the device and synchronize with the server when connected.
- **Responsive and bilingual.** Record and review on phones, tablets and desktops in English or European Portuguese.

## Technology

| Area                          | Technologies                                      |
| ----------------------------- | ------------------------------------------------- |
| Application                   | TypeScript, Next.js App Router and React.         |
| Interface                     | Mantine, CSS Modules and Lucide icons.            |
| Client data and state         | Dexie with IndexedDB, TanStack Query and Zustand. |
| Server persistence            | PostgreSQL, Drizzle ORM and node-postgres.        |
| Authentication and validation | Better Auth and Zod.                              |
| Offline app and localization  | Serwist and next-intl.                            |

Local records and queued changes are saved together in IndexedDB. Authenticated APIs synchronize accepted changes to PostgreSQL, while the service worker caches application files for offline access. The [architecture guide](docs/architecture.md) explains the data flow and transaction boundaries.

## Run locally

Requires Node.js 24, npm 11 and Docker with Compose.

1. Install dependencies and create the local environment file:

   ```sh
   npm ci
   [ -f .env ] || cp .env.example .env
   ```

2. Configure `DATABASE_URL` and `BETTER_AUTH_URL` in `.env`. Set `BETTER_AUTH_SECRET` to a random value of at least 32 characters. Generate one with:

   ```sh
   openssl rand -hex 48
   ```

3. Start PostgreSQL, apply migrations and create the first administrator:

   ```sh
   npm run db:up
   npm run db:migrate
   npm run auth:bootstrap-admin
   ```

4. Start the application:

   ```sh
   npm run dev
   ```

Open [localhost:3000](http://localhost:3000) and sign in with the administrator account.

For a production build, use `npm run build` followed by `npm run start`. The [local development guide](docs/local-development.md) covers environment configuration, account commands and production offline previews. Production hosting is documented in the [deployment guide](docs/deployment.md).

Contact: [contact@filipemendes.dev](mailto:contact@filipemendes.dev).
