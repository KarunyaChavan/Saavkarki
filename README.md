# Saavkarki

Local-first lending management app scaffold for a collateral-based loan business.

## What is in this first pass

- Customers, vehicles, loans, payments, and document vault entries
- Local SQLite storage on mobile/native
- Local browser storage for Expo web testing
- Simple-interest and compound-interest loan calculations
- Dashboard totals and due-loan summaries
- Search across customers, vehicles, and loans
- Demo seed data for a quick first run

## What is intentionally deferred

- Cloud sync
- OTP login
- Push notifications
- S3 or Firebase storage
- WhatsApp reminders

## Notes

- The app is structured as an Expo React Native app with TypeScript.
- It uses a platform-specific storage boundary:
  - `src/storage/database.native.ts` uses `expo-sqlite`
  - `src/storage/database.web.ts` uses browser `localStorage` for easy web testing
- Feature code lives under `src/features/ledger` and is split into controller, screens, forms, and reusable components.

## Next step

Install the Expo dependencies, then run:

```bash
npm install
npm start
```

The local database will be created automatically on first launch.

For browser testing:

```bash
npm run web
```

For verification:

```bash
npm run typecheck
npx expo export --platform web
```
