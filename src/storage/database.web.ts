/**
 * @file Web-compatible in-memory storage stub for the Saavkarki lending app.
 *       Mirrors the database.native API but persists to localStorage instead
 *       of SQLite. Used during development with react-native-web.
 */

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
 * Customer row without relation arrays (they are hydrated at load time).
 */
type CustomerRow = Omit<Customer, "vehicles" | "loans" | "documents">;

/**
 * In-memory store shape mirroring the database tables.
 */
type WebStore = {
    customers: CustomerRow[];
    vehicles: Vehicle[];
    documents: CustomerDocument[];
    loans: Loan[];
    payments: Payment[];
    notifications: NotificationItem[];
    auditLogs: AuditLog[];
};

/** localStorage key used to persist the entire store. */
const storageKey = "saavkarki:web-store";

/**
 * Factory for a blank WebStore.
 *
 * @returns An empty store object.
 */
const emptyStore = (): WebStore => ({
    customers: [],
    vehicles: [],
    documents: [],
    loans: [],
    payments: [],
    notifications: [],
    auditLogs: [],
});

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
 * Deserialise the store from localStorage.
 *
 * @returns The current WebStore (or an empty store on first run / SSR).
 */
function readStore(): WebStore {
    if (typeof window === "undefined") return emptyStore();

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return emptyStore();

    try {
        return { ...emptyStore(), ...JSON.parse(raw) };
    } catch {
        return emptyStore();
    }
}

/**
 * Serialise the store to localStorage.
 *
 * @param store - The store to persist.
 */
function writeStore(store: WebStore) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(store));
}

/**
 * Append an audit log entry to the store.
 *
 * @param store      - The store to mutate.
 * @param entityType - Type of entity affected.
 * @param entityId   - ID of the affected entity.
 * @param action     - Description of the action.
 * @param payload    - The saved data for traceability.
 */
function audit(
    store: WebStore,
    entityType: string,
    entityId: string,
    action: string,
    payload: unknown,
) {
    store.auditLogs.unshift({
        id: uid("log"),
        entityType,
        entityId,
        action,
        payloadJson: JSON.stringify(payload),
        createdAt: now(),
    });
}

/**
 * Append a notification to the store.
 *
 * @param store   - The store to mutate.
 * @param loanId  - Related loan ID.
 * @param title   - Notification title.
 * @param body    - Notification body.
 * @param dueDate - ISO date string.
 */
function createNotification(
    store: WebStore,
    loanId: string,
    title: string,
    body: string,
    dueDate: string,
) {
    store.notifications.unshift({
        id: uid("ntf"),
        loanId,
        title,
        body,
        dueDate,
        isRead: 0,
        createdAt: now(),
    });
}

/**
 * Initialise the web store — ensures a store exists in localStorage.
 */
export async function initDatabase() {
    writeStore(readStore());
}

/**
 * Delete all data by writing an empty store to localStorage.
 */
export async function deleteAllData() {
    writeStore(emptyStore());
}

/**
 * Seed one demo customer, vehicle, loan, and payment if the store is empty.
 */
export async function seedDatabaseIfEmpty() {
    const store = readStore();
    if (store.customers.length > 0) return;

    const customerId = uid("cus");
    const vehicleId = uid("veh");
    const loanId = uid("loan");
    const stamp = now();
    const today = dateKey(new Date());

    store.customers.push({
        id: customerId,
        fullName: "Demo Customer",
        mobileNumber: "9000000000",
        alternateMobileNumber: "9000000001",
        address: "Sample address for local-first demo data",
        notes: "Seeded customer for the first run.",
        photoUri: "",
        createdAt: stamp,
        updatedAt: stamp,
    });
    store.vehicles.push({
        id: vehicleId,
        customerId,
        vehicleType: "Bike",
        registrationNumber: "KA01AB1234",
        make: "Hero",
        model: "Splendor",
        year: "2022",
        color: "Black",
        chassisNumber: "CHASSIS-DEMO-001",
        engineNumber: "ENGINE-DEMO-001",
        photoUrisJson: "[]",
        createdAt: stamp,
        updatedAt: stamp,
    });
    store.loans.push({
        id: loanId,
        loanCode: "LN-1001",
        customerId,
        vehicleId,
        principalAmount: 35000,
        interestRate: 10,
        interestMode: "simple",
        loanDate: today,
        dueDate: today,
        status: "active",
        notes: "Demo loan for monthly interest collection.",
        createdAt: stamp,
        updatedAt: stamp,
    });
    store.payments.push({
        id: uid("pay"),
        loanId,
        paymentType: "interest",
        amount: 3500,
        paymentDate: today,
        notes: "First interest collection",
        createdAt: stamp,
    });

    writeStore(store);
}

/**
 * Insert a new customer and write an audit log.
 *
 * @param values - The customer form data.
 * @returns The newly generated customer ID.
 */
export async function createCustomer(values: CustomerFormValues) {
    const store = readStore();
    const id = uid("cus");
    const stamp = now();

    store.customers.unshift({
        id,
        fullName: values.fullName.trim(),
        mobileNumber: values.mobileNumber.trim(),
        alternateMobileNumber: values.alternateMobileNumber.trim() || undefined,
        address: values.address.trim() || undefined,
        notes: values.notes.trim() || undefined,
        photoUri: values.photoUri.trim() || undefined,
        createdAt: stamp,
        updatedAt: stamp,
    });
    audit(store, "customer", id, "create", values);
    writeStore(store);
    return id;
}

/**
 * Update an existing customer in the store.
 *
 * @param id     - The customer's ID.
 * @param values - The updated form data.
 */
export async function updateCustomer(id: string, values: CustomerFormValues) {
    const store = readStore();
    const customer = store.customers.find((item) => item.id === id);
    if (!customer) return;

    Object.assign(customer, {
        fullName: values.fullName.trim(),
        mobileNumber: values.mobileNumber.trim(),
        alternateMobileNumber: values.alternateMobileNumber.trim() || undefined,
        address: values.address.trim() || undefined,
        notes: values.notes.trim() || undefined,
        photoUri: values.photoUri.trim() || undefined,
        updatedAt: now(),
    });
    audit(store, "customer", id, "update", values);
    writeStore(store);
}

/**
 * Insert a new vehicle / collateral record.
 *
 * @param values - The vehicle data.
 * @returns The newly generated vehicle ID.
 */
export async function createVehicle(values: Vehicle) {
    const store = readStore();
    const id = values.id || uid("veh");
    const stamp = now();

    store.vehicles.unshift({
        ...values,
        id,
        registrationNumber: values.registrationNumber.trim(),
        make: values.make.trim(),
        model: values.model.trim(),
        year: values.year.trim(),
        color: values.color.trim(),
        chassisNumber: values.chassisNumber.trim(),
        engineNumber: values.engineNumber.trim(),
        photoUrisJson: values.photoUrisJson || "[]",
        createdAt: stamp,
        updatedAt: stamp,
    });
    audit(store, "vehicle", id, "create", values);
    writeStore(store);
    return id;
}

/**
 * Insert a new document record.
 *
 * @param values - The document form data.
 * @returns The newly generated document ID.
 */
export async function createCustomerDocument(values: DocumentFormValues) {
    const store = readStore();
    const id = uid("doc");
    const stamp = now();

    store.documents.unshift({
        id,
        customerId: values.customerId,
        vehicleId: values.vehicleId || null,
        documentScope: values.documentScope,
        documentType: values.documentType.trim(),
        documentNumber: values.documentNumber.trim(),
        fileUri: values.fileUri.trim(),
        uploadDate: values.uploadDate,
        expiryDate: values.expiryDate.trim() || null,
        notes: values.notes.trim() || null,
        createdAt: stamp,
        updatedAt: stamp,
    });
    audit(store, "document", id, "create", values);
    writeStore(store);
    return id;
}

/**
 * Insert a new loan record and generate a loan code.
 *
 * @param values - The loan form data.
 * @returns The newly generated loan ID.
 */
export async function createLoan(values: LoanFormValues) {
    const store = readStore();
    const id = uid("loan");
    const stamp = now();
    const loanCode = `LN-${Date.now().toString().slice(-6)}`;

    store.loans.unshift({
        id,
        loanCode,
        customerId: values.customerId,
        vehicleId: values.vehicleId,
        principalAmount: toNumber(values.principalAmount),
        interestRate: toNumber(values.interestRate),
        interestMode: values.interestMode,
        loanDate: values.loanDate,
        dueDate: values.dueDate,
        status: values.status,
        notes: values.notes.trim() || undefined,
        createdAt: stamp,
        updatedAt: stamp,
    });
    createNotification(store, id, "Loan created", `Loan ${loanCode} is active.`, values.dueDate);
    audit(store, "loan", id, "create", values);
    writeStore(store);
    return id;
}

/**
 * Insert a new payment record and auto-update the loan status (closed / overdue).
 *
 * @param values - The payment form data.
 * @returns The newly generated payment ID.
 */
export async function createPayment(values: PaymentFormValues) {
    const store = readStore();
    const id = uid("pay");

    store.payments.unshift({
        id,
        loanId: values.loanId,
        paymentType: values.paymentType,
        amount: toNumber(values.amount),
        paymentDate: values.paymentDate,
        notes: values.notes.trim() || undefined,
        createdAt: now(),
    });

    const loan = store.loans.find((item) => item.id === values.loanId);
    if (loan) {
        const summary = summarizeLoan(
            loan,
            store.payments.filter((payment) => payment.loanId === values.loanId),
        );
        if (summary.balance <= 0) loan.status = "closed";
        else if (summary.daysRemaining < 0) loan.status = "overdue";
        loan.updatedAt = now();
    }

    audit(store, "payment", id, "create", values);
    writeStore(store);
    return id;
}

/**
 * Hydrate flat customer rows into full Customer objects with related
 * vehicles, loans, and documents attached.
 *
 * @param store - The current store.
 * @returns An array of fully hydrated Customer objects.
 */
function hydrateCustomers(store: WebStore): Customer[] {
    return store.customers.map((customer) => ({
        ...customer,
        vehicles: store.vehicles.filter((vehicle) => vehicle.customerId === customer.id),
        loans: store.loans.filter((loan) => loan.customerId === customer.id),
        documents: store.documents.filter((document) => document.customerId === customer.id),
    }));
}

/**
 * Compute dashboard aggregates from loans and payments.
 *
 * @param loans    - All loan records.
 * @param payments - All payment records.
 * @returns A DashboardStats object.
 */
function computeDashboard(loans: Loan[], payments: Payment[]) {
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
    const monthPrefix = today.slice(0, 7);

    return {
        totalMoneyLent: loans.reduce((sum, loan) => sum + loan.principalAmount, 0),
        totalOutstandingPrincipal,
        totalInterestCollected: payments
            .filter(
                (payment) =>
                    payment.paymentType === "interest" || payment.paymentType === "settlement",
            )
            .reduce((sum, payment) => sum + payment.amount, 0),
        activeLoans: loans.filter((loan) => loan.status === "active").length,
        overdueLoans: loans.filter((loan) => loan.status === "overdue").length,
        defaultedLoans: loans.filter((loan) => loan.status === "defaulted").length,
        todaysCollections: payments
            .filter((payment) => isSameDate(payment.paymentDate, today))
            .reduce((sum, payment) => sum + payment.amount, 0),
        thisMonthsCollections: payments
            .filter((payment) => payment.paymentDate.startsWith(monthPrefix))
            .reduce((sum, payment) => sum + payment.amount, 0),
        expectedCollections,
    };
}

/**
 * Load the full application state from localStorage.
 *
 * @returns A complete DatabaseAppState snapshot.
 */
export async function loadAppState(): Promise<DatabaseAppState> {
    const store = readStore();

    return {
        customers: hydrateCustomers(store),
        vehicles: store.vehicles,
        loans: store.loans,
        payments: store.payments,
        documents: store.documents,
        notifications: store.notifications,
        auditLogs: store.auditLogs,
        dashboard: computeDashboard(store.loans, store.payments),
    };
}
