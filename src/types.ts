/**
 * @file Shared TypeScript type definitions for the Saavkarki lending app.
 */

export type InterestMode = "simple" | "compound";
export type LoanStatus = "active" | "closed" | "overdue" | "defaulted";
export type PaymentType = "interest" | "principal" | "settlement";
export type DocumentScope = "customer" | "vehicle";

export type Customer = {
    id: string;
    fullName: string;
    mobileNumber: string;
    alternateMobileNumber?: string;
    address?: string;
    notes?: string;
    photoUri?: string;
    createdAt: string;
    updatedAt: string;
    vehicles: Vehicle[];
    loans: Loan[];
    documents: CustomerDocument[];
};

export type Vehicle = {
    id: string;
    customerId: string;
    vehicleType: string;
    registrationNumber: string;
    make: string;
    model: string;
    year: string;
    color: string;
    chassisNumber: string;
    engineNumber: string;
    photoUrisJson: string;
    createdAt: string;
    updatedAt: string;
};

export type CustomerDocument = {
    id: string;
    customerId: string;
    vehicleId?: string | null;
    documentScope: DocumentScope;
    documentType: string;
    documentNumber: string;
    fileUri: string;
    uploadDate: string;
    expiryDate?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
};

export type Loan = {
    id: string;
    loanCode: string;
    customerId: string;
    vehicleId: string;
    principalAmount: number;
    interestRate: number;
    interestMode: InterestMode;
    loanDate: string;
    dueDate: string;
    status: LoanStatus;
    notes?: string;
    createdAt: string;
    updatedAt: string;
};

export type Payment = {
    id: string;
    loanId: string;
    paymentType: PaymentType;
    amount: number;
    paymentDate: string;
    notes?: string;
    createdAt: string;
};

export type NotificationItem = {
    id: string;
    loanId: string;
    title: string;
    body: string;
    dueDate: string;
    isRead: number;
    createdAt: string;
};

export type AuditLog = {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    payloadJson: string;
    createdAt: string;
};

export type DashboardStats = {
    totalMoneyLent: number;
    totalOutstandingPrincipal: number;
    totalInterestCollected: number;
    activeLoans: number;
    overdueLoans: number;
    defaultedLoans: number;
    todaysCollections: number;
    thisMonthsCollections: number;
    expectedCollections: number;
};

export type DatabaseAppState = {
    customers: Customer[];
    vehicles: Vehicle[];
    loans: Loan[];
    payments: Payment[];
    documents: CustomerDocument[];
    notifications: NotificationItem[];
    auditLogs: AuditLog[];
    dashboard: DashboardStats;
};

export type TempDocument = {
    id: string;
    documentScope: DocumentScope;
    documentType: string;
    documentNumber: string;
    fileUri: string;
    uploadDate: string;
    expiryDate: string;
    notes: string;
};

export type CustomerFormValues = {
    fullName: string;
    mobileNumber: string;
    alternateMobileNumber: string;
    address: string;
    notes: string;
    photoUri: string;
    tempDocuments: TempDocument[];
};

export type LoanFormValues = {
    customerId: string;
    vehicleId: string;
    principalAmount: string;
    interestRate: string;
    interestMode: InterestMode;
    loanDate: string;
    dueDate: string;
    status: LoanStatus;
    notes: string;
};

export type PaymentFormValues = {
    loanId: string;
    paymentType: PaymentType;
    amount: string;
    paymentDate: string;
    notes: string;
};

export type DocumentFormValues = {
    customerId: string;
    vehicleId: string;
    documentScope: DocumentScope;
    documentType: string;
    documentNumber: string;
    fileUri: string;
    uploadDate: string;
    expiryDate: string;
    notes: string;
};

export type Screen =
    | "dashboard"
    | "customers"
    | "loans"
    | "search"
    | "settings"
    | "customer-detail"
    | "loan-detail";
