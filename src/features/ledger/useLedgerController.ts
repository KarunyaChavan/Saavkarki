import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import {
  emptyCustomerForm,
  emptyDocumentForm,
  emptyLoanForm,
  emptyPaymentForm,
  emptyVehicleForm,
} from "../../constants/forms";
import {
  createCustomer,
  createCustomerDocument,
  createLoan,
  createPayment,
  createVehicle,
  deleteAllData,
  initDatabase,
  loadAppState,
  seedDatabaseIfEmpty,
  updateCustomer,
} from "../../storage/database";
import {
  Customer,
  CustomerFormValues,
  DatabaseAppState,
  DocumentFormValues,
  LoanFormValues,
  PaymentFormValues,
  Screen,
  Vehicle,
} from "../../types";
import { searchWithinState } from "../../utils/loanMath";

export type ModalKey = "customer" | "vehicle" | "loan" | "payment" | "document";

export function useLedgerController() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<DatabaseAppState | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);

  const [customerForm, setCustomerForm] =
    useState<CustomerFormValues>(emptyCustomerForm());
  const [vehicleForm, setVehicleForm] = useState<Vehicle>(emptyVehicleForm(""));
  const [loanForm, setLoanForm] = useState<LoanFormValues>(
    emptyLoanForm("", ""),
  );
  const [paymentForm, setPaymentForm] = useState<PaymentFormValues>(
    emptyPaymentForm(""),
  );
  const [documentForm, setDocumentForm] = useState<DocumentFormValues>(
    emptyDocumentForm(""),
  );

  const refresh = useCallback(async () => {
    setState(await loadAppState());
  }, []);

  useEffect(() => {
    let alive = true;

    async function boot() {
      await initDatabase();
      await seedDatabaseIfEmpty();
      if (!alive) return;
      await refresh();
      setLoading(false);
    }

    boot().catch((error) => {
      console.warn(error);
      setLoading(false);
      Alert.alert("Startup failed", String(error));
    });

    return () => {
      alive = false;
    };
  }, [refresh]);

  const selectedCustomer = useMemo(
    () =>
      state?.customers.find((customer) => customer.id === selectedCustomerId) ??
      null,
    [selectedCustomerId, state?.customers],
  );

  const selectedLoan = useMemo(
    () => state?.loans.find((loan) => loan.id === selectedLoanId) ?? null,
    [selectedLoanId, state?.loans],
  );

  const filteredSearch = useMemo(() => {
    if (!state) return { customers: [], vehicles: [], loans: [] };
    return searchWithinState(state, query);
  }, [query, state]);

  const customerForLoan = useCallback(
    (loanId: string) =>
      state?.customers.find((customer) =>
        customer.loans.some((loan) => loan.id === loanId),
      ),
    [state?.customers],
  );

  const closeModal = () => setActiveModal(null);

  const openCustomerModal = (customer?: Customer) => {
    setEditingCustomerId(customer?.id ?? null);
    setCustomerForm(
      customer
        ? {
            fullName: customer.fullName,
            mobileNumber: customer.mobileNumber,
            alternateMobileNumber: customer.alternateMobileNumber ?? "",
            address: customer.address ?? "",
            notes: customer.notes ?? "",
            photoUri: customer.photoUri ?? "",
            tempDocuments: [],
          }
        : emptyCustomerForm(),
    );
    setActiveModal("customer");
  };

  const openVehicleModal = (customerId: string) => {
    if (!customerId) {
      Alert.alert(
        "Choose customer",
        "Open a customer before adding a vehicle.",
      );
      return;
    }
    setVehicleForm(emptyVehicleForm(customerId));
    setActiveModal("vehicle");
  };

  const openLoanModal = (customerId: string, vehicleId = "") => {
    setLoanForm(emptyLoanForm(customerId, vehicleId));
    setActiveModal("loan");
  };

  const openPaymentModal = (loanId: string) => {
    if (!loanId) {
      Alert.alert("Choose loan", "Open a loan before adding a payment.");
      return;
    }
    setPaymentForm(emptyPaymentForm(loanId));
    setActiveModal("payment");
  };

  const openDocumentModal = (customerId: string, vehicleId = "") => {
    if (!customerId) {
      Alert.alert(
        "Choose customer",
        "Open a customer before adding a document.",
      );
      return;
    }
    setDocumentForm({
      ...emptyDocumentForm(customerId),
      vehicleId,
      documentScope: vehicleId ? "vehicle" : "customer",
    });
    setActiveModal("document");
  };

  const submitCustomer = async () => {
    if (!customerForm.fullName.trim() || !customerForm.mobileNumber.trim()) {
      Alert.alert("Missing data", "Please enter a name and mobile number.");
      return;
    }

    setBusy(true);
    try {
      if (editingCustomerId) {
        await updateCustomer(editingCustomerId, customerForm);
        for (const doc of customerForm.tempDocuments) {
          await createCustomerDocument({
            vehicleId: "",
            ...doc,
            customerId: editingCustomerId,
          });
        }
      } else {
        const id = await createCustomer(customerForm);
        setSelectedCustomerId(id);
        for (const doc of customerForm.tempDocuments) {
          await createCustomerDocument({
            vehicleId: "",
            ...doc,
            customerId: id,
          });
        }
      }
      await refresh();
      setEditingCustomerId(null);
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const submitVehicle = async () => {
    const isVehicle =
      vehicleForm.vehicleType === "Bike" || vehicleForm.vehicleType === "Car";
    if (isVehicle && !vehicleForm.registrationNumber.trim()) {
      Alert.alert(
        "Missing data",
        "Please enter a registration number for the vehicle.",
      );
      return;
    }
    if (!vehicleForm.make.trim()) {
      Alert.alert("Missing data", "Please enter the brand / manufacturer.");
      return;
    }

    // For non-vehicle collateral that has no registration, use a safe placeholder
    const formToSave = {
      ...vehicleForm,
      registrationNumber: vehicleForm.registrationNumber.trim() || "N/A",
    };

    setBusy(true);
    try {
      await createVehicle(formToSave);
      await refresh();
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const submitLoan = async () => {
    if (!loanForm.customerId) {
      Alert.alert("Missing data", "Please select a customer for this loan.");
      return;
    }
    if (!loanForm.vehicleId) {
      Alert.alert(
        "Missing data",
        "Please select collateral for this loan. Add collateral to the customer first if none appears.",
      );
      return;
    }
    if (!loanForm.principalAmount || Number(loanForm.principalAmount) <= 0) {
      Alert.alert("Missing data", "Please enter a valid principal amount.");
      return;
    }

    setBusy(true);
    try {
      const id = await createLoan(loanForm);
      setSelectedLoanId(id);
      await refresh();
      closeModal();
      setScreen("loan-detail");
    } finally {
      setBusy(false);
    }
  };

  const submitPayment = async () => {
    setBusy(true);
    try {
      await createPayment(paymentForm);
      await refresh();
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const submitDocument = async () => {
    setBusy(true);
    try {
      await createCustomerDocument(documentForm);
      await refresh();
      closeModal();
    } finally {
      setBusy(false);
    }
  };

  const resetLocalData = () => {
    Alert.alert(
      "Clear local data",
      "This removes the SQLite demo data on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setBusy(true);
            try {
              await deleteAllData();
              await seedDatabaseIfEmpty();
              await refresh();
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const firstCustomerId = state?.customers[0]?.id ?? "";
  const defaultCustomerId = selectedCustomer?.id ?? firstCustomerId;
  const defaultVehicleId =
    selectedCustomer?.vehicles[0]?.id ??
    state?.vehicles.find((vehicle) => vehicle.customerId === defaultCustomerId)
      ?.id ??
    "";

  return {
    activeModal,
    busy,
    closeModal,
    customerForLoan,
    customerForm,
    defaultCustomerId,
    defaultVehicleId,
    documentForm,
    editingCustomerId,
    filteredSearch,
    loading,
    loanForm,
    openCustomerModal,
    openDocumentModal,
    openLoanModal,
    openPaymentModal,
    openVehicleModal,
    paymentForm,
    query,
    resetLocalData,
    screen,
    selectedCustomer,
    selectedLoan,
    setCustomerForm,
    setDocumentForm,
    setLoanForm,
    setPaymentForm,
    setQuery,
    setScreen,
    setSelectedCustomerId,
    setSelectedLoanId,
    setVehicleForm,
    state,
    submitCustomer,
    submitDocument,
    submitLoan,
    submitPayment,
    submitVehicle,
    vehicleForm,
  };
}
