import { Customer, DatabaseAppState, Loan, Payment } from "../types";

export function toNumber(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString("en-IN")}`;
}

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

export function dateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}

export function isSameDate(left: string | Date, right: string | Date) {
  return dateKey(left) === dateKey(right);
}

export function daysBetween(from: string, to: Date = new Date()) {
  const start = new Date(from);
  const end = new Date(to);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function addMonths(date: string, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function getLoanMonthlyInterest(loan: Loan) {
  return loan.principalAmount * (loan.interestRate / 100);
}

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
    Math.max(
      1,
      Math.floor(
        interestPaymentTotal / Math.max(1, getLoanMonthlyInterest(loan)),
      ),
    ) + 1,
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

export function getLoanRiskTone(daysRemaining: number, status: string) {
  if (status === "closed") return "green" as const;
  if (status === "defaulted") return "red" as const;
  if (daysRemaining < 0) return "red" as const;
  if (daysRemaining <= 3) return "yellow" as const;
  return "green" as const;
}

export function getLoanSummary(
  loan: Loan,
  payments: Payment[],
  customer?: Customer,
) {
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
    [
      loan.loanCode,
      loan.status,
      String(loan.principalAmount),
      String(loan.interestRate),
    ].some((value) => value.toLowerCase().includes(normalized)),
  );

  return { customers, vehicles, loans };
}
