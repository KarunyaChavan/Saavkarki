# Saavkarki — Agents Context

## Project Overview
React Native (Expo) mobile app for collateral-based lending management. Single lender tracks loans disbursed against physical collateral (bikes, cars, gold, electronics, etc.), records monthly interest/principal payments, and manages identity & vehicle documents.

**Entry:** `App.tsx` → `src/features/ledger/LedgerApp.tsx`
**Run:** `npm start` / `npm run web` / `npm run android` / `npm run ios`
**Check:** `npm run typecheck` (tsc --noEmit), `npm run lint` (eslint)

## Tech Stack
- **React 19 + React Native** (latest), Expo SDK latest
- **expo-sqlite** (local-first, no backend)
- **expo-document-picker** (file uploads)
- **expo-status-bar**
- **react-native-web** (for dev)
- TypeScript (strict mode), ESLint (universe config)

## Project Structure
```
App.tsx                          # Entry: re-exports LedgerApp
src/
  types.ts                       # All TS types (Customer, Loan, Payment, Vehicle, etc.)
  constants/forms.ts             # emptyCustomerForm(), emptyLoanForm(), doc/collateral type arrays
  styles/appStyles.ts            # THEME tokens + all StyleSheet definitions (single file)
  utils/
    loanMath.ts                  # formatCurrency, summarizeLoan, getLoanSummary, searchWithinState, getMonthwiseInterestSummary
    display.ts                   # toneClass helper for risk badges
  storage/
    database.native.ts           # SQLite CRUD + seeding + dashboard computation
    database.web.ts              # Web-compatible in-memory stub (mirrors native API)
  features/ledger/
    LedgerApp.tsx                # Root: shell layout, header, screen routing, modals
    screens.tsx                  # All screen components: Dashboard, Customers, Loans, Search, Settings, CustomerDetail, LoanDetail
    components.tsx               # Reusable: Avatar, PressableScale, Section, ScreenList, DetailHeader, BottomBar, StatGrid, LoanDetailCard
    forms.tsx                    # Modal forms: CustomerEditor, VehicleEditor, LoanEditor, PaymentEditor, DocumentEditor; plus DropdownPicker, EditorSheet, FormField
    useLedgerController.ts       # Central state hook: screen routing, form state, CRUD orchestration, validation, search debounce
```

## Architecture Patterns

### State Management
- Single **`useLedgerController`** hook (`useLedgerController.ts`) owns all state via `useState`.
- State is passed down as props to screens/components. No context/Redux.
- `LedgerApp.tsx` renders screens conditionally via `ledger.screen === "dashboard"` etc.
- Forms use local state managed in the controller, passed as `values` + `onChange` to editors.

### Screen Routing
- Simple string-based routing via `ledger.screen` setter (no React Navigation).
- `showMainHeader` / `showBottomBar` toggle based on whether screen is a detail screen.
- Screens: `"dashboard"` | `"customers"` | `"loans"` | `"search"` | `"settings"` | `"customer-detail"` | `"loan-detail"`

### Styling Convention
- **Single file:** `src/styles/appStyles.ts`
- `THEME` object defines spacing (xs/sm/md/lg/xl), colors, borderRadius, shadows.
- All styles via `StyleSheet.create()` using `THEME.*` tokens. Inline styles are rare — only for one-off layout tweaks.

### Component Patterns
- Functional components with explicit prop interfaces.
- **Section** wraps content in a card with optional title + action button.
- **ScreenList<T>** generic wrapper for list screens with ScrollView + Section + pull-to-refresh.
- **StatGrid** renders 2-column dashboard stat cards.
- **EditorSheet** is the modal wrapper for all forms (bottom sheet style).
- **PressableScale** wraps RN Pressable with opacity feedback on press.
- React.memo applied to Section, StatGrid, LoanDetailCard, DetailHeader, Avatar (as AvatarMemo).

### Form Patterns
- Each editor component wraps content in `<Modal>` + `<EditorSheet>`.
- Use **DropdownPicker<T>** (generic) for dropdown selects, supports search.
- Use **FormField** for labeled input groups with optional inline error.
- `DocumentPicker.getDocumentAsync()` for file selection.
- Photo preview via `<Image>` with local URI.
- Inline field-level validation shows red border + error text on invalid fields.

### Database
- SQLite via `expo-sqlite`. Two files per platform convention: `database.native.ts` (SQLite) and `database.web.ts` (in-memory stub).
- Auto-generates IDs via `uid()` with type prefix (`cus_`, `veh_`, `loan_`, `pay_`, `doc_`).
- Auto-seeds 1 customer, 1 vehicle, 1 loan, 1 payment on first launch.
- Audit logs on every create/update.
- Payment submission auto-updates loan status to `"closed"` or `"overdue"` based on balance.

## Key Business Logic (loanMath.ts)
- **`summarizeLoan(loan, payments)`** → outstanding principal, interest due, balance, next due date
- **`getLoanSummary(loan, payments, customer)`** → adds tone (green/yellow/red), dueLabel
- **`getMonthwiseInterestSummary(loans, payments, monthPrefix)`** → paid/unpaid split for dashboard
- **`searchWithinState(state, query)`** → cross-entity search

## Current Uncommitted Changes
1. `scroll` style gained `paddingTop: THEME.spacing.md` for header-to-content spacing
2. `alert()` → `Alert.alert()` across forms
3. Duplicated doc/collateral type arrays extracted to `constants/forms.ts`
4. Demo defaults removed from form initializers (`principalAmount`, `interestRate`, `amount` now empty string)
5. `TempDocument` type added to `types.ts`
6. `PressableScale` component added — all `Pressable` replaced with `PressableScale` for opacity feedback
7. `React.memo` on Section, StatGrid, LoanDetailCard, DetailHeader, AvatarMemo
8. `RefreshControl` on DashboardScreen, ScreenList, CustomerDetailScreen, LoanDetailScreen
9. `SCROLL_BOTTOM_PADDING` derived from `BOTTOM_BAR_HEIGHT` + `THEME.spacing.lg`
10. `dashboardWelcome` style + text in DashboardScreen
11. Search debounce (300ms) via `useDebouncedValue` in controller
12. Inline field-level validation — `FormErrors` type, red border + error text on invalid fields, replaces `Alert.alert` dialogs
13. `.prettierrc` with `tabWidth: 4` — all files reformatted
14. `@file` headers + JSDoc comments on all exported functions/components
15. Unused imports cleaned up (`useCallback`, `useMemo`, `useState` named imports → `React.*` usage; unused `Avatar` import)
16. Unused `useDebouncedValue` hook and `useRef` import removed from old location

## Naming & Code Conventions
- Types file: `src/types.ts` — all shared types
- Type exports: direct named exports, no `export default`
- Style imports: `import { styles, THEME } from "../../styles/appStyles"`
- Component file exports: `export function ComponentName(...)`
- All source files have `@file` header + JSDoc on exported functions
- Use `Platform.select()` for platform-specific values (status bar padding, etc.)
- Currency formatting: `formatCurrency(n)` returns `"Rs. X,XXX"`
- Date formatting: `formatDate(str)` returns eg `"07 Jun 2026"`
- Tab size: 4 spaces (enforced via `.prettierrc`)
- Avoid inline comments in production code; prefer descriptive JSDoc
