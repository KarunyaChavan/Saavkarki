/**
 * @file SQLite storage layer for the Saavkarki lending app.
 *       Provides CRUD operations, seeding, dashboard computation,
 *       and audit logging — all backed by expo-sqlite.
 */

import * as SQLite from "expo-sqlite";
import {
    AuditLog,
    Customer,
    CustomerDocument,
    CustomerFormValues,
    DatabaseAppState,
    DocumentFormValues,
    Loan,
    LoanFormValues,
    NotificationItem,
    Payment,
    PaymentFormValues,
    Vehicle,
} from "../types";
import { dateKey, isSameDate, summarizeLoan, toNumber } from "../utils/loanMath";

/**
 * Singleton promise for the SQLite database connection.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Returns (and lazily creates) the singleton database connection.
 *
 * @returns A promise resolving to the SQLiteDatabase instance.
 */
function database() {
    if (!dbPromise) {
        dbPromise = SQLite.openDatabaseAsync("saavkarki.db");
    }
    return dbPromise;
}

/**
 * Execute a raw SQL statement (no return rows).
 *
 * @param sql - The SQL string to execute.
 */
async function exec(sql: string) {
    const db = await database();
    await db.execAsync(sql);
}

/**
 * Normalise parameters, replacing undefined with null for SQLite compatibility.
 *
 * @param params - Raw parameter array.
 * @returns Sanitised array with null in place of undefined.
 */
function bindParams(params: (string | number | null | undefined)[]) {
    return params.map((param) => param ?? null);
}

/**
 * Execute a SQL statement with bound parameters (no return rows).
 *
 * @param sql    - The SQL string with ? placeholders.
 * @param params - Values to bind.
 */
async function run(sql: string, ...params: (string | number | null | undefined)[]) {
    const db = await database();
    return db.runAsync(sql, ...bindParams(params));
}

/**
 * Query rows from the database with bound parameters.
 *
 * @param sql    - The SELECT SQL string.
 * @param params - Values to bind.
 * @returns Array of result rows typed as T.
 */
async function all<T>(sql: string, ...params: (string | number | null | undefined)[]) {
    const db = await database();
    return db.getAllAsync<T>(sql, ...bindParams(params));
}

/**
 * Initialise the database schema — creates all tables if they do not exist
 * and enables foreign key enforcement.
 */
export async function initDatabase() {
    await exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      fullName TEXT NOT NULL,
      mobileNumber TEXT NOT NULL,
      alternateMobileNumber TEXT,
      address TEXT,
      notes TEXT,
      photoUri TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      customerId TEXT NOT NULL,
      vehicleType TEXT NOT NULL,
      registrationNumber TEXT NOT NULL,
      make TEXT,
      model TEXT,
      year TEXT,
      color TEXT,
      chassisNumber TEXT,
      engineNumber TEXT,
      photoUrisJson TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_documents (
      id TEXT PRIMARY KEY NOT NULL,
      customerId TEXT NOT NULL,
      vehicleId TEXT,
      documentScope TEXT NOT NULL,
      documentType TEXT NOT NULL,
      documentNumber TEXT NOT NULL,
      fileUri TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      expiryDate TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY NOT NULL,
      loanCode TEXT NOT NULL,
      customerId TEXT NOT NULL,
      vehicleId TEXT NOT NULL,
      principalAmount REAL NOT NULL,
      interestRate REAL NOT NULL,
      interestMode TEXT NOT NULL,
      loanDate TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      loanId TEXT NOT NULL,
      paymentType TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL,
      notes TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      loanId TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      action TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

/**
 * Current timestamp in ISO 8601 format.
 *
 * @returns ISO string like "2026-06-08T12:34:56.789Z".
 */
function now() {
    return new Date().toISOString();
}

/**
 * Generate a unique ID with a type prefix (e.g. "cus_...").
 *
 * @param prefix - Short string identifying the entity type.
 * @returns Globally unique ID string.
 */
function uid(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/**
 * Write an audit log entry.
 *
 * @param entityType - Type of entity affected ("customer", "loan", etc.).
 * @param entityId   - ID of the affected entity.
 * @param action     - Description of the action performed.
 * @param payload    - The data that was saved (for traceability).
 */
async function audit(entityType: string, entityId: string, action: string, payload: unknown) {
    await run(
        "INSERT INTO audit_logs (id, entityType, entityId, action, payloadJson, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
        uid("log"),
        entityType,
        entityId,
        action,
        JSON.stringify(payload),
        now(),
    );
}

/**
 * Insert a notification record for a loan.
 *
 * @param loanId - The related loan ID.
 * @param title  - Notification title.
 * @param body   - Notification body text.
 * @param dueDate - ISO date string for the due date.
 */
async function createNotification(loanId: string, title: string, body: string, dueDate: string) {
    await run(
        "INSERT INTO notifications (id, loanId, title, body, dueDate, isRead, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)",
        uid("ntf"),
        loanId,
        title,
        body,
        dueDate,
        now(),
    );
}

/**
 * Delete all records from every table (clears the database).
 */
export async function deleteAllData() {
    await exec(`
    DELETE FROM payments;
    DELETE FROM loans;
    DELETE FROM customer_documents;
    DELETE FROM vehicles;
    DELETE FROM customers;
    DELETE FROM notifications;
    DELETE FROM audit_logs;
  `);
}

/**
 * Seed one demo customer, vehicle, loan, and payment if the customers
 * table is empty. Safe to call repeatedly — only inserts once.
 */
export async function seedDatabaseIfEmpty() {
    const rows = await all<{ count: number }>("SELECT COUNT(*) as count FROM customers");
    if ((rows[0]?.count ?? 0) > 0) return;

    const customerId = uid("cus");
    const vehicleId = uid("veh");
    const loanId = uid("loan");
    const createdAt = now();

    await run(
        "INSERT INTO customers (id, fullName, mobileNumber, alternateMobileNumber, address, notes, photoUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        customerId,
        "Demo Customer",
        "9000000000",
        "9000000001",
        "Sample address for local-first demo data",
        "Seeded customer for the first run.",
        "",
        createdAt,
        createdAt,
    );
    await run(
        "INSERT INTO vehicles (id, customerId, vehicleType, registrationNumber, make, model, year, color, chassisNumber, engineNumber, photoUrisJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        vehicleId,
        customerId,
        "Bike",
        "KA01AB1234",
        "Hero",
        "Splendor",
        "2022",
        "Black",
        "CHASSIS-DEMO-001",
        "ENGINE-DEMO-001",
        JSON.stringify([]),
        createdAt,
        createdAt,
    );
    await run(
        "INSERT INTO loans (id, loanCode, customerId, vehicleId, principalAmount, interestRate, interestMode, loanDate, dueDate, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        loanId,
        "LN-1001",
        customerId,
        vehicleId,
        35000,
        10,
        "simple",
        new Date().toISOString().slice(0, 10),
        new Date().toISOString().slice(0, 10),
        "active",
        "Demo loan for monthly interest collection.",
        createdAt,
        createdAt,
    );
    await run(
        "INSERT INTO payments (id, loanId, paymentType, amount, paymentDate, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        uid("pay"),
        loanId,
        "interest",
        3500,
        new Date().toISOString().slice(0, 10),
        "First interest collection",
        createdAt,
    );
}

/**
 * Insert a new customer record and write an audit log.
 *
 * @param values - The customer form data.
 * @returns The newly generated customer ID.
 */
export async function createCustomer(values: CustomerFormValues) {
    const id = uid("cus");
    const stamp = now();
    await run(
        "INSERT INTO customers (id, fullName, mobileNumber, alternateMobileNumber, address, notes, photoUri, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        values.fullName.trim(),
        values.mobileNumber.trim(),
        values.alternateMobileNumber.trim() || null,
        values.address.trim() || null,
        values.notes.trim() || null,
        values.photoUri.trim() || null,
        stamp,
        stamp,
    );
    await audit("customer", id, "create", values);
    return id;
}

/**
 * Update an existing customer record.
 *
 * @param id     - The customer's ID.
 * @param values - The updated form data.
 */
export async function updateCustomer(id: string, values: CustomerFormValues) {
    const stamp = now();
    await run(
        "UPDATE customers SET fullName = ?, mobileNumber = ?, alternateMobileNumber = ?, address = ?, notes = ?, photoUri = ?, updatedAt = ? WHERE id = ?",
        values.fullName.trim(),
        values.mobileNumber.trim(),
        values.alternateMobileNumber.trim() || null,
        values.address.trim() || null,
        values.notes.trim() || null,
        values.photoUri.trim() || null,
        stamp,
        id,
    );
    await audit("customer", id, "update", values);
}

/**
 * Insert a new vehicle / collateral record.
 *
 * @param values - The vehicle or collateral data.
 * @returns The newly generated vehicle ID.
 */
export async function createVehicle(values: Vehicle) {
    const id = values.id || uid("veh");
    const stamp = now();
    await run(
        "INSERT INTO vehicles (id, customerId, vehicleType, registrationNumber, make, model, year, color, chassisNumber, engineNumber, photoUrisJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        values.customerId,
        values.vehicleType,
        values.registrationNumber.trim(),
        values.make.trim(),
        values.model.trim(),
        values.year.trim(),
        values.color.trim(),
        values.chassisNumber.trim(),
        values.engineNumber.trim(),
        values.photoUrisJson || "[]",
        stamp,
        stamp,
    );
    await audit("vehicle", id, "create", values);
    return id;
}

/**
 * Insert a new document record (customer or collateral scope).
 *
 * @param values - The document form data.
 * @returns The newly generated document ID.
 */
export async function createCustomerDocument(values: DocumentFormValues) {
    const id = uid("doc");
    const stamp = now();
    await run(
        "INSERT INTO customer_documents (id, customerId, vehicleId, documentScope, documentType, documentNumber, fileUri, uploadDate, expiryDate, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        values.customerId,
        values.vehicleId || null,
        values.documentScope,
        values.documentType.trim(),
        values.documentNumber.trim(),
        values.fileUri.trim(),
        values.uploadDate,
        values.expiryDate.trim() || null,
        values.notes.trim() || null,
        stamp,
        stamp,
    );
    await audit("document", id, "create", values);
    return id;
}

/**
 * Insert a new loan record, generate a loan code, and create a
 * notification for the new loan.
 *
 * @param values - The loan form data.
 * @returns The newly generated loan ID.
 */
export async function createLoan(values: LoanFormValues) {
    const id = uid("loan");
    const stamp = now();
    const loanCode = `LN-${Date.now().toString().slice(-6)}`;
    await run(
        "INSERT INTO loans (id, loanCode, customerId, vehicleId, principalAmount, interestRate, interestMode, loanDate, dueDate, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id,
        loanCode,
        values.customerId,
        values.vehicleId,
        toNumber(values.principalAmount),
        toNumber(values.interestRate),
        values.interestMode,
        values.loanDate,
        values.dueDate,
        values.status,
        values.notes.trim() || null,
        stamp,
        stamp,
    );
    await createNotification(id, "Loan created", `Loan ${loanCode} is active.`, values.dueDate);
    await audit("loan", id, "create", values);
    return id;
}

/**
 * Insert a new payment record and automatically update the loan status
 * to "closed" if the balance reaches zero, or "overdue" if days remaining
 * are negative.
 *
 * @param values - The payment form data.
 * @returns The newly generated payment ID.
 */
export async function createPayment(values: PaymentFormValues) {
    const id = uid("pay");
    const stamp = now();
    await run(
        "INSERT INTO payments (id, loanId, paymentType, amount, paymentDate, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        id,
        values.loanId,
        values.paymentType,
        toNumber(values.amount),
        values.paymentDate,
        values.notes.trim() || null,
        stamp,
    );
    await audit("payment", id, "create", values);

    const loans = await all<Loan>("SELECT * FROM loans WHERE id = ?", values.loanId);
    const loan = loans[0];
    if (loan) {
        const payments = await all<Payment>(
            "SELECT * FROM payments WHERE loanId = ?",
            values.loanId,
        );
        const summary = summarizeLoan(loan, payments);
        if (summary.balance <= 0) {
            await run(
                "UPDATE loans SET status = ?, updatedAt = ? WHERE id = ?",
                "closed",
                now(),
                values.loanId,
            );
        } else if (summary.daysRemaining < 0) {
            await run(
                "UPDATE loans SET status = ?, updatedAt = ? WHERE id = ?",
                "overdue",
                now(),
                values.loanId,
            );
        }
    }
    return id;
}

/**
 * Compute dashboard aggregate stats from the full loans and payments arrays.
 *
 * @param loans    - All loan records.
 * @param payments - All payment records.
 * @returns A DashboardStats object.
 */
async function computeDashboard(loans: Loan[], payments: Payment[]) {
    const totalMoneyLent = loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const totalInterestCollected = payments
        .filter(
            (payment) => payment.paymentType === "interest" || payment.paymentType === "settlement",
        )
        .reduce((sum, payment) => sum + payment.amount, 0);

    const activeLoans = loans.filter((loan) => loan.status === "active").length;
    const overdueLoans = loans.filter((loan) => loan.status === "overdue").length;
    const defaultedLoans = loans.filter((loan) => loan.status === "defaulted").length;

    let totalOutstandingPrincipal = 0;
    let expectedCollections = 0;
    for (const loan of loans) {
        const summary = summarizeLoan(
            loan,
            payments.filter((payment) => payment.loanId === loan.id),
        );
        totalOutstandingPrincipal += summary.principalOutstanding;
        expectedCollections += summary.interestDue;
    }

    const today = dateKey(new Date());
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const todaysCollections = payments
        .filter((payment) => isSameDate(payment.paymentDate, today))
        .reduce((sum, payment) => sum + payment.amount, 0);
    const thisMonthsCollections = payments
        .filter((payment) => payment.paymentDate.startsWith(monthPrefix))
        .reduce((sum, payment) => sum + payment.amount, 0);

    return {
        totalMoneyLent,
        totalOutstandingPrincipal,
        totalInterestCollected,
        activeLoans,
        overdueLoans,
        defaultedLoans,
        todaysCollections,
        thisMonthsCollections,
        expectedCollections,
    };
}

/**
 * Load the full application state by reading all tables and hydrating
 * customer relations (vehicles, loans, documents).
 *
 * @returns A complete DatabaseAppState snapshot.
 */
export async function loadAppState(): Promise<DatabaseAppState> {
    const customers = await all<Customer>("SELECT * FROM customers ORDER BY createdAt DESC");
    const vehicles = await all<Vehicle>("SELECT * FROM vehicles ORDER BY createdAt DESC");
    const loans = await all<Loan>("SELECT * FROM loans ORDER BY createdAt DESC");
    const payments = await all<Payment>("SELECT * FROM payments ORDER BY createdAt DESC");
    const documents = await all<CustomerDocument>(
        "SELECT * FROM customer_documents ORDER BY createdAt DESC",
    );
    const notifications = await all<NotificationItem>(
        "SELECT * FROM notifications ORDER BY createdAt DESC",
    );
    const auditLogs = await all<AuditLog>("SELECT * FROM audit_logs ORDER BY createdAt DESC");

    const hydratedCustomers = customers.map((customer) => ({
        ...customer,
        vehicles: vehicles.filter((vehicle) => vehicle.customerId === customer.id),
        loans: loans.filter((loan) => loan.customerId === customer.id),
        documents: documents.filter((document) => document.customerId === customer.id),
    }));

    const dashboard = await computeDashboard(loans, payments);

    return {
        customers: hydratedCustomers,
        vehicles,
        loans,
        payments,
        documents,
        notifications,
        auditLogs,
        dashboard,
    };
}
