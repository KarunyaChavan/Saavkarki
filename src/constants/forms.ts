/**
 * @file Form initializers and shared constants for document/collateral types.
 */

import {
    CustomerFormValues,
    DocumentFormValues,
    LoanFormValues,
    PaymentFormValues,
    Vehicle,
} from "../types";

/**
 * Accepted identity document types for customers.
 */
export const CUSTOMER_DOC_TYPES = [
    "Aadhaar",
    "PAN",
    "Passport",
    "Driving License",
    "Other",
] as const;

export const COLLATERAL_DOC_TYPES = [
    "RC Book",
    "Insurance",
    "PUC Certificate",
    "Purchase Invoice",
    "Other",
] as const;

export const COLLATERAL_TYPES = [
    "Bike",
    "Car",
    "Smartphone",
    "Television",
    "Gold",
    "Other",
] as const;

/**
 * Today's date as YYYY-MM-DD string.
 */
export const todayKey = () => new Date().toISOString().slice(0, 10);

/**
 * Default empty customer form values.
 */
export const emptyCustomerForm = (): CustomerFormValues => ({
    fullName: "",
    mobileNumber: "",
    alternateMobileNumber: "",
    address: "",
    notes: "",
    photoUri: "",
    tempDocuments: [],
});

/**
 * Default empty vehicle/collateral form initialized for a given customer.
 *
 * @param customerId - The owning customer's ID.
 * @returns A blank Vehicle object with defaults.
 */
export const emptyVehicleForm = (customerId: string): Vehicle => ({
    id: "",
    customerId,
    vehicleType: "Bike",
    registrationNumber: "",
    make: "",
    model: "",
    year: "",
    color: "",
    chassisNumber: "",
    engineNumber: "",
    photoUrisJson: "[]",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

/**
 * Default empty loan form for a given customer and optional vehicle.
 *
 * @param customerId - The borrowing customer's ID.
 * @param vehicleId  - The collateral vehicle's ID.
 * @returns A blank LoanFormValues with today as both dates.
 */
export const emptyLoanForm = (customerId: string, vehicleId: string): LoanFormValues => ({
    customerId,
    vehicleId,
    principalAmount: "",
    interestRate: "",
    interestMode: "simple",
    loanDate: todayKey(),
    dueDate: todayKey(),
    status: "active",
    notes: "",
});

/**
 * Default empty payment form for a given loan.
 *
 * @param loanId - The loan this payment belongs to.
 * @returns A blank PaymentFormValues with today as date.
 */
export const emptyPaymentForm = (loanId: string): PaymentFormValues => ({
    loanId,
    paymentType: "interest",
    amount: "",
    paymentDate: todayKey(),
    notes: "",
});

/**
 * Default empty document form for a given customer.
 *
 * @param customerId - The customer this document will be attached to.
 * @returns A blank DocumentFormValues scoped to "customer".
 */
export const emptyDocumentForm = (customerId: string): DocumentFormValues => ({
    customerId,
    vehicleId: "",
    documentScope: "customer",
    documentType: "Aadhaar",
    documentNumber: "",
    fileUri: "",
    uploadDate: todayKey(),
    expiryDate: "",
    notes: "",
});
