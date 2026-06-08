/**
 * @file Loan mathematics — currency formatting, summary calculations,
 *       interest tracking, and cross-entity search.
 */

import { Customer, DatabaseAppState, Loan, Payment } from "../types";

/**
 * Safely parse a numeric value from string, number, or null.
 *
 * @param value - The raw value to parse.
 * @returns A finite number, or 0 on failure.
 */
export function toNumber(value: string | number | null | undefined) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const parsed = Number(String(value ?? "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Format a number as Indian Rupee string (e.g. "Rs. 1,234").
 *
 * @param amount - Numeric value to format.
 * @returns Formatted INR string.
 */
export function formatCurrency(amount: number) {
    return `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Format a date string (YYYY-MM-DD) into a readable Indian format (e.g. "07 Jun 2026").
 *
 * @param value - ISO date string.
 * @returns Formatted date string, or the original value if parsing fails.
 */
export function formatDate(value: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

/**
 * Normalise a date value to a YYYY-MM-DD key string.
 *
 * @param value - A date string or Date object.
 * @returns ISO date key (YYYY-MM-DD).
 */
export function dateKey(value: string | Date) {
    const date = typeof value === "string" ? new Date(value) : value;
    return date.toISOString().slice(0, 10);
}

/**
 * Check whether two dates fall on the same calendar day.
 *
 * @param left  - First date.
 * @param right - Second date.
 * @returns True if both share the same date key.
 */
export function isSameDate(left: string | Date, right: string | Date) {
    return dateKey(left) === dateKey(right);
}

/**
 * Calculate the number of calendar days between two dates.
 *
 * @param from - Start date string.
 * @param to   - End date (defaults to today).
 * @returns Day count (can be negative if `to` precedes `from`).
 */
export function daysBetween(from: string, to: Date = new Date()) {
    const start = new Date(from);
    const end = new Date(to);
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Add a number of months to a date string.
 *
 * @param date   - Base date as YYYY-MM-DD.
 * @param months - Number of months to add (can be negative).
 * @returns A new Date object.
 */
export function addMonths(date: string, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
}

/**
 * Compute the monthly interest amount for a loan.
 *
 * @param loan - The loan object.
 * @returns Interest amount for one month.
 */
export function getLoanMonthlyInterest(loan: Loan) {
    return loan.principalAmount * (loan.interestRate / 100);
}

/**
 * Group payments by month label for display in the payment history section.
 *
 * @param payments - Array of payment records.
 * @returns Array of { label, items } groups sorted chronologically.
 */
export function groupPayments(payments: Payment[]) {
    const groups = new Map<string, Payment[]>();
    for (const payment of payments) {
        const label = new Date(payment.paymentDate).toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
        });
        const list = groups.get(label) ?? [];
        list.push(payment);
        groups.set(label, list);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({
        label,
        items,
    }));
}

/**
 * Compute outstanding principal, interest due, total balance, and next due date.
 *
 * @param loan     - The loan to summarise.
 * @param payments - All payments recorded against this loan.
 * @returns Summary object with principalOutstanding, interestDue, balance, nextDueDate, etc.
 */
export function summarizeLoan(loan: Loan, payments: Payment[]) {
    const interestPaymentTotal = payments
        .filter((payment) => payment.paymentType === "interest")
        .reduce((sum, payment) => sum + payment.amount, 0);
    const principalPaymentTotal = payments
        .filter((payment) => payment.paymentType === "principal")
        .reduce((sum, payment) => sum + payment.amount, 0);
    const settlementPaymentTotal = payments
        .filter((payment) => payment.paymentType === "settlement")
        .reduce((sum, payment) => sum + payment.amount, 0);

    const principalOutstanding = Math.max(
        0,
        loan.principalAmount - principalPaymentTotal - settlementPaymentTotal,
    );
    const monthsElapsed = Math.max(1, Math.ceil(daysBetween(loan.loanDate) / 30));
    const expectedSimpleInterest = getLoanMonthlyInterest(loan) * monthsElapsed;
    const compoundedBalance =
        loan.principalAmount * Math.pow(1 + loan.interestRate / 100, monthsElapsed);
    const expectedInterest =
        loan.interestMode === "compound"
            ? Math.max(0, compoundedBalance - loan.principalAmount)
            : expectedSimpleInterest;
    const interestDue = Math.max(
        0,
        expectedInterest - interestPaymentTotal - settlementPaymentTotal,
    );
    const balance =
        loan.interestMode === "compound"
            ? Math.max(
                  0,
                  compoundedBalance -
                      principalPaymentTotal -
                      interestPaymentTotal -
                      settlementPaymentTotal,
              )
            : Math.max(0, principalOutstanding + interestDue);

    const nextDueDate = addMonths(
        loan.loanDate,
        Math.max(1, Math.floor(interestPaymentTotal / Math.max(1, getLoanMonthlyInterest(loan)))) +
            1,
    );
    const daysRemaining = daysBetween(dateKey(new Date()), nextDueDate);

    return {
        principalOutstanding,
        interestDue,
        balance,
        nextDueDate,
        daysRemaining,
        customerName: "",
        vehicleLabel: "",
    };
}

/**
 * Map a loan's days-remaining and status to a risk tone.
 *
 * @param daysRemaining - Days until next due date (negative = overdue).
 * @param status        - Loan status string.
 * @returns "green" | "yellow" | "red".
 */
export function getLoanRiskTone(daysRemaining: number, status: string) {
    if (status === "closed") return "green" as const;
    if (status === "defaulted") return "red" as const;
    if (daysRemaining < 0) return "red" as const;
    if (daysRemaining <= 3) return "yellow" as const;
    return "green" as const;
}

/**
 * Enrich a loan with display metadata: tone, dueLabel, statusLabel, customerName.
 *
 * @param loan     - The loan to summarise.
 * @param payments - Payments recorded against this loan.
 * @param customer - Optional customer (provides name for the summary).
 * @returns Loan summary extended with tone, labels, and customer info.
 */
export function getLoanSummary(loan: Loan, payments: Payment[], customer?: Customer) {
    const core = summarizeLoan(loan, payments);
    const daysRemaining = daysBetween(dateKey(new Date()), core.nextDueDate);
    const tone = getLoanRiskTone(daysRemaining, loan.status);
    const dueLabel =
        daysRemaining < 0
            ? `${Math.abs(daysRemaining)} day(s) overdue`
            : `${daysRemaining} day(s) remaining`;

    return {
        ...core,
        tone,
        dueLabel,
        statusLabel: loan.status,
        customerName: customer?.fullName ?? "",
        vehicleLabel:
            customer?.vehicles.find((vehicle) => vehicle.id === loan.vehicleId)
                ?.registrationNumber ?? loan.vehicleId,
    };
}

/**
 * Full-text search across customers, vehicles, and loans.
 * Matches name, mobile, registration, and loan code.
 *
 * @param state - The full application state.
 * @param query - Raw search string (case-insensitive).
 * @returns Filtered subsets of customers, vehicles, and loans.
 */
export function searchWithinState(state: DatabaseAppState, query: string) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
        return {
            customers: state.customers,
            vehicles: state.vehicles,
            loans: state.loans,
        };
    }

    const customers = state.customers.filter((customer) =>
        [
            customer.fullName,
            customer.mobileNumber,
            customer.alternateMobileNumber,
            customer.address,
            customer.notes,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized)),
    );
    const vehicles = state.vehicles.filter((vehicle) =>
        [
            vehicle.registrationNumber,
            vehicle.make,
            vehicle.model,
            vehicle.chassisNumber,
            vehicle.engineNumber,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalized)),
    );
    const loans = state.loans.filter((loan) =>
        [loan.loanCode, loan.status, String(loan.principalAmount), String(loan.interestRate)].some(
            (value) => value.toLowerCase().includes(normalized),
        ),
    );

    return { customers, vehicles, loans };
}

/**
 * Split active loans into paid/unpaid groups for a given calendar month prefix (YYYY-MM).
 *
 * @param loans       - All loans in state.
 * @param payments    - All payments in state.
 * @param monthPrefix - Month key in YYYY-MM format.
 * @returns Object with paid and unpaid loan arrays.
 */
export function getMonthwiseInterestSummary(
    loans: Loan[],
    payments: Payment[],
    monthPrefix: string,
) {
    const activeLoansInMonth = loans.filter((loan) => {
        const startMonth = loan.loanDate.slice(0, 7);
        if (startMonth > monthPrefix) return false;

        if (loan.status === "closed") {
            const closedMonth = (loan.updatedAt || loan.createdAt).slice(0, 7);
            return closedMonth >= monthPrefix;
        }

        return true;
    });

    const paid: Loan[] = [];
    const unpaid: Loan[] = [];

    for (const loan of activeLoansInMonth) {
        const hasPaidInMonth = payments.some(
            (payment) =>
                payment.loanId === loan.id &&
                (payment.paymentType === "interest" || payment.paymentType === "settlement") &&
                payment.paymentDate.startsWith(monthPrefix),
        );

        if (hasPaidInMonth) {
            paid.push(loan);
        } else {
            unpaid.push(loan);
        }
    }

    return { paid, unpaid };
}
