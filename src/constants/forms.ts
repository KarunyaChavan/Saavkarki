import {
  CustomerFormValues,
  DocumentFormValues,
  LoanFormValues,
  PaymentFormValues,
  Vehicle,
} from "../types";

export const todayKey = () => new Date().toISOString().slice(0, 10);

export const emptyCustomerForm = (): CustomerFormValues => ({
  fullName: "",
  mobileNumber: "",
  alternateMobileNumber: "",
  address: "",
  notes: "",
  photoUri: "",
});

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

export const emptyLoanForm = (customerId: string, vehicleId: string): LoanFormValues => ({
  customerId,
  vehicleId,
  principalAmount: "35000",
  interestRate: "10",
  interestMode: "simple",
  loanDate: todayKey(),
  dueDate: todayKey(),
  status: "active",
  notes: "",
});

export const emptyPaymentForm = (loanId: string): PaymentFormValues => ({
  loanId,
  paymentType: "interest",
  amount: "3500",
  paymentDate: todayKey(),
  notes: "",
});

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
