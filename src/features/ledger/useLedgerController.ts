/**
 * @file Central state hook — owns all application state, screen routing,
 *       form state, CRUD orchestration, validation, and search debounce.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/**
 * Debounce a value by the given delay in milliseconds.
 *
 * @param value - The raw (fast-changing) value.
 * @param delay - Debounce window in ms.
 * @returns The stabilised value, updated only after `delay` ms of inactivity.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer.current);
    }, [value, delay]);

    return debounced;
}

export type ModalKey = "customer" | "vehicle" | "loan" | "payment" | "document";
export type FormErrors = Record<string, string>;

/**
 * Central state hook for the entire app.
 * Manages screen routing, form state, CRUD operations, search, and validation.
 *
 * @returns An object containing all state values, setters, and action handlers.
 */
export function useLedgerController() {
    const [screen, setScreen] = useState<Screen>("dashboard");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [state, setState] = useState<DatabaseAppState | null>(null);
    const [query, setQuery] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
    const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
    const [formErrors, setFormErrors] = useState<FormErrors>({});

    const [customerForm, setCustomerForm] = useState<CustomerFormValues>(emptyCustomerForm());
    const [vehicleForm, setVehicleForm] = useState<Vehicle>(emptyVehicleForm(""));
    const [loanForm, setLoanForm] = useState<LoanFormValues>(emptyLoanForm("", ""));
    const [paymentForm, setPaymentForm] = useState<PaymentFormValues>(emptyPaymentForm(""));
    const [documentForm, setDocumentForm] = useState<DocumentFormValues>(emptyDocumentForm(""));

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
        () => state?.customers.find((customer) => customer.id === selectedCustomerId) ?? null,
        [selectedCustomerId, state?.customers],
    );

    const selectedLoan = useMemo(
        () => state?.loans.find((loan) => loan.id === selectedLoanId) ?? null,
        [selectedLoanId, state?.loans],
    );

    const debouncedQuery = useDebouncedValue(query, 300);

    const filteredSearch = useMemo(() => {
        if (!state) return { customers: [], vehicles: [], loans: [] };
        return searchWithinState(state, debouncedQuery);
    }, [debouncedQuery, state]);

    const customerForLoan = useCallback(
        (loanId: string) =>
            state?.customers.find((customer) => customer.loans.some((loan) => loan.id === loanId)),
        [state?.customers],
    );

    const closeModal = () => {
        setActiveModal(null);
        setFormErrors({});
    };

    const openCustomerModal = (customer?: Customer) => {
        setEditingCustomerId(customer?.id ?? null);
        setFormErrors({});
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
            Alert.alert("Choose customer", "Open a customer before adding a vehicle.");
            return;
        }
        setFormErrors({});
        setVehicleForm(emptyVehicleForm(customerId));
        setActiveModal("vehicle");
    };

    const openLoanModal = (customerId: string, vehicleId = "") => {
        setFormErrors({});
        setLoanForm(emptyLoanForm(customerId, vehicleId));
        setActiveModal("loan");
    };

    const openPaymentModal = (loanId: string) => {
        if (!loanId) {
            Alert.alert("Choose loan", "Open a loan before adding a payment.");
            return;
        }
        setFormErrors({});
        setPaymentForm(emptyPaymentForm(loanId));
        setActiveModal("payment");
    };

    const openDocumentModal = (customerId: string, vehicleId = "") => {
        if (!customerId) {
            Alert.alert("Choose customer", "Open a customer before adding a document.");
            return;
        }
        setFormErrors({});
        setDocumentForm({
            ...emptyDocumentForm(customerId),
            vehicleId,
            documentScope: vehicleId ? "vehicle" : "customer",
        });
        setActiveModal("document");
    };

    const submitCustomer = async () => {
        const errors: FormErrors = {};
        if (!customerForm.fullName.trim()) errors.fullName = "Name is required";
        if (!customerForm.mobileNumber.trim()) errors.mobileNumber = "Mobile number is required";
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
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
        const errors: FormErrors = {};
        const isVehicle = vehicleForm.vehicleType === "Bike" || vehicleForm.vehicleType === "Car";
        if (isVehicle && !vehicleForm.registrationNumber.trim()) {
            errors.registrationNumber = "Registration number is required for vehicles";
        }
        if (!vehicleForm.make.trim()) {
            errors.make = "Brand / manufacturer is required";
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
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
        const errors: FormErrors = {};
        if (!loanForm.customerId) {
            errors.customerId = "Please select a customer for this loan";
        }
        if (!loanForm.vehicleId) {
            errors.vehicleId = "Please select collateral for this loan";
        }
        if (!loanForm.principalAmount || Number(loanForm.principalAmount) <= 0) {
            errors.principalAmount = "Please enter a valid principal amount";
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
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
        const errors: FormErrors = {};
        if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
            errors.amount = "Please enter a valid payment amount";
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
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
        const errors: FormErrors = {};
        if (!documentForm.documentType.trim()) {
            errors.documentType = "Document type is required";
        }
        if (!documentForm.fileUri) {
            errors.fileUri = "Please select a document file";
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
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
        Alert.alert("Clear local data", "This removes the SQLite demo data on this device.", [
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
        ]);
    };

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refresh();
        } finally {
            setRefreshing(false);
        }
    }, [refresh]);

    const firstCustomerId = state?.customers[0]?.id ?? "";
    const defaultCustomerId = selectedCustomer?.id ?? firstCustomerId;
    const defaultVehicleId =
        selectedCustomer?.vehicles[0]?.id ??
        state?.vehicles.find((vehicle) => vehicle.customerId === defaultCustomerId)?.id ??
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
        formErrors,
        handleRefresh,
        loading,
        loanForm,
        openCustomerModal,
        openDocumentModal,
        openLoanModal,
        openPaymentModal,
        openVehicleModal,
        paymentForm,
        query,
        refreshing,
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
