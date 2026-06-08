# Saavkarki

**Local-first lending ledger** — Track loans, collateral, and payments entirely on your device. No internet, no cloud, no monthly fees.

---

## For the Lender

### What is this?

Saavkarki is a mobile app for managing a small lending business. If you give out loans against physical items (bikes, cars, gold, electronics), this app helps you:

- Keep a list of every customer and their contact details
- Record what item was kept as **collateral** against each loan
- Log **monthly interest** and **principal payments**
- See your **dashboard** — total money lent, outstanding principal, overdue loans
- **Search** across customers, loan codes, and vehicle numbers
- Attach **photos and scanned documents** (Aadhaar, RC book, etc.)

Everything stays on your phone — no data is sent anywhere.

### Quick Start

1. Make sure you have the **Expo Go** app installed on your phone (iOS or Android).
2. Run `npm start` on your computer and scan the QR code.
3. The app will create a demo customer + loan on first launch so you can explore immediately.

---

## For Developers

### Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + React Native (Expo SDK latest) |
| Language | TypeScript (strict mode) |
| Storage | `expo-sqlite` (native) / `localStorage` (web) |
| File picker | `expo-document-picker` |
| Linting | ESLint (`universe/native`) + Prettier |
| Dev web | `react-native-web` |

### Project Structure

```
App.tsx                              # Entry re-export
src/
  types.ts                           # All shared TypeScript types
  constants/forms.ts                 # Form initialisers, doc/collateral type constants
  styles/appStyles.ts                # Single file — THEME tokens + every StyleSheet
  utils/
    loanMath.ts                      # Currency format, loan summary, interest calc, search
    display.ts                       # Risk badge tone mapper
  storage/
    database.native.ts               # SQLite CRUD — used on iOS/Android
    database.web.ts                  # In-memory localStorage stub — used on web
  features/ledger/
    LedgerApp.tsx                    # Root shell: header, screen routing, modals
    useLedgerController.ts           # Central hook: all state, CRUD, validation
    screens.tsx                      # Dashboard, Customers, Loans, Search, Settings, Detail screens
    components.tsx                   # Reusable: Avatar, PressableScale, Section, ScreenList, etc.
    forms.tsx                        # Modal editors: Customer, Vehicle, Loan, Payment, Document
```
