/**
 * @file App entry point — re-exports the LedgerApp root component.
 *       This indirection allows expo-router / AppEntry.js to bootstrap cleanly.
 */

import { LedgerApp } from "./src/features/ledger/LedgerApp";

export default LedgerApp;
