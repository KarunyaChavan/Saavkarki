import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";

import { styles } from "../../styles/appStyles";
import { Screen } from "../../types";
import { BottomBar } from "./components";
import {
  CustomerEditor,
  DocumentEditor,
  LoanEditor,
  PaymentEditor,
  VehicleEditor,
} from "./forms";
import {
  CustomerDetailScreen,
  CustomersScreen,
  DashboardScreen,
  LoanDetailScreen,
  LoansScreen,
  SearchScreen,
  SettingsScreen,
} from "./screens";
import { useLedgerController } from "./useLedgerController";

const tabs: Screen[] = [
  "dashboard",
  "customers",
  "loans",
  "search",
  "settings",
];

const tabLabel = (screen: Screen) =>
  screen === "dashboard"
    ? "Dashboard"
    : screen[0].toUpperCase() + screen.slice(1);

function DocumentViewerModal({
  visible,
  document,
  onClose,
}: {
  visible: boolean;
  document: any | null;
  onClose: () => void;
}) {
  if (!document) return null;

  const isImage =
    document.fileUri &&
    (document.fileUri.startsWith("data:image/") ||
      document.fileUri.toLowerCase().endsWith(".png") ||
      document.fileUri.toLowerCase().endsWith(".jpg") ||
      document.fileUri.toLowerCase().endsWith(".jpeg") ||
      document.fileUri.toLowerCase().endsWith(".webp"));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.viewerBackdrop}>
        <View style={styles.viewerContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sectionTitle}>{document.documentType}</Text>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text style={styles.secondaryButtonText}>Close</Text>
            </Pressable>
          </View>

          <View
            style={{ width: "100%", alignItems: "center", marginVertical: 12 }}
          >
            {isImage ? (
              <Image
                source={{ uri: document.fileUri }}
                style={styles.viewerImage}
              />
            ) : (
              <View style={styles.viewerPdfPlaceholder}>
                <Text style={styles.viewerPdfIcon}>📄</Text>
                <Text style={styles.viewerPdfText}>PDF Document</Text>
                <Text style={styles.rowSub} numberOfLines={1}>
                  {document.fileUri.substring(
                    document.fileUri.lastIndexOf("/") + 1,
                  ) || "document.pdf"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.viewerMeta}>
            <View style={styles.viewerMetaRow}>
              <Text style={styles.viewerMetaLabel}>Doc Number:</Text>
              <Text style={styles.viewerMetaValue}>
                {document.documentNumber || "N/A"}
              </Text>
            </View>
            <View style={styles.viewerMetaRow}>
              <Text style={styles.viewerMetaLabel}>Scope:</Text>
              <Text style={styles.viewerMetaValue}>
                {document.documentScope}
              </Text>
            </View>
            {document.expiryDate ? (
              <View style={styles.viewerMetaRow}>
                <Text style={styles.viewerMetaLabel}>Expiry Date:</Text>
                <Text style={styles.viewerMetaValue}>
                  {document.expiryDate}
                </Text>
              </View>
            ) : null}
            {document.notes ? (
              <View style={styles.viewerMetaRow}>
                <Text style={styles.viewerMetaLabel}>Notes:</Text>
                <Text style={styles.viewerMetaValue}>{document.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function LedgerApp() {
  const ledger = useLedgerController();
  const [selectedDoc, setSelectedDoc] = React.useState<any | null>(null);
  const [viewerVisible, setViewerVisible] = React.useState(false);

  if (ledger.loading || !ledger.state) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#0f766e" />
        <Text style={styles.loadingText}>Loading local ledger...</Text>
      </SafeAreaView>
    );
  }

  const openSelectedLoan = (loanId: string) => {
    ledger.setSelectedLoanId(loanId);
    ledger.setScreen("loan-detail");
  };

  const openSelectedCustomer = (customerId: string) => {
    ledger.setSelectedCustomerId(customerId);
    ledger.setScreen("customer-detail");
  };

  const openDefaultLoanModal = () =>
    ledger.openLoanModal(ledger.defaultCustomerId, ledger.defaultVehicleId);
  const selectedLoanPayments = ledger.state.payments.filter(
    (payment) => payment.loanId === ledger.selectedLoan?.id,
  );

  // Determine whether to display the main header and navigation tabs
  const isDetailScreen =
    ledger.screen === "customer-detail" || ledger.screen === "loan-detail";
  const showMainHeader = !isDetailScreen;
  const showBottomBar = !isDetailScreen;

  return (
    <SafeAreaView style={styles.shell}>
      <ExpoStatusBar style="dark" />

      {showMainHeader ? (
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>Saavkarki</Text>
            <Text style={styles.appSubtitle}>Local-first lending ledger</Text>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() => ledger.openCustomerModal()}
          >
            <Text style={styles.primaryButtonText}>New customer</Text>
          </Pressable>
        </View>
      ) : null}

      {showMainHeader ? (
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tab, ledger.screen === tab && styles.tabActive]}
              onPress={() => ledger.setScreen(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  ledger.screen === tab && styles.tabTextActive,
                ]}
              >
                {tabLabel(tab)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {ledger.screen === "dashboard" ? (
        <DashboardScreen
          state={ledger.state}
          customerForLoan={ledger.customerForLoan}
          onOpenLoan={openSelectedLoan}
        />
      ) : null}

      {ledger.screen === "customers" ? (
        <CustomersScreen
          customers={ledger.state.customers}
          onCreate={() => ledger.openCustomerModal()}
          onSelect={openSelectedCustomer}
        />
      ) : null}

      {ledger.screen === "loans" ? (
        <LoansScreen
          state={ledger.state}
          customerForLoan={ledger.customerForLoan}
          onCreate={openDefaultLoanModal}
          onSelect={openSelectedLoan}
        />
      ) : null}

      {ledger.screen === "search" ? (
        <SearchScreen
          query={ledger.query}
          results={ledger.filteredSearch}
          onQueryChange={ledger.setQuery}
          onSelectCustomer={openSelectedCustomer}
          onSelectLoan={openSelectedLoan}
        />
      ) : null}

      {ledger.screen === "settings" ? (
        <SettingsScreen busy={ledger.busy} onReset={ledger.resetLocalData} />
      ) : null}

      {ledger.screen === "customer-detail" && ledger.selectedCustomer ? (
        <CustomerDetailScreen
          customer={ledger.selectedCustomer}
          state={ledger.state}
          onBack={() => ledger.setScreen("customers")}
          onEdit={() =>
            ledger.openCustomerModal(ledger.selectedCustomer ?? undefined)
          }
          onAddVehicle={() =>
            ledger.openVehicleModal(ledger.selectedCustomer?.id ?? "")
          }
          onAddDocument={() =>
            ledger.openDocumentModal(ledger.selectedCustomer?.id ?? "")
          }
          onAddLoan={openDefaultLoanModal}
          onSelectLoan={openSelectedLoan}
          onViewDocument={(doc) => {
            setSelectedDoc(doc);
            setViewerVisible(true);
          }}
        />
      ) : null}

      {ledger.screen === "loan-detail" && ledger.selectedLoan ? (
        <LoanDetailScreen
          loan={ledger.selectedLoan}
          payments={selectedLoanPayments}
          customer={ledger.customerForLoan(ledger.selectedLoan.id)}
          onBack={() => ledger.setScreen("loans")}
          onAddPayment={() =>
            ledger.openPaymentModal(ledger.selectedLoan?.id ?? "")
          }
        />
      ) : null}

      {showBottomBar ? (
        <BottomBar
          onCreateCustomer={() => ledger.openCustomerModal()}
          onCreateLoan={openDefaultLoanModal}
          onCreateDocument={() =>
            ledger.openDocumentModal(
              ledger.selectedCustomer?.id ?? ledger.defaultCustomerId,
            )
          }
        />
      ) : null}

      <DocumentViewerModal
        visible={viewerVisible}
        document={selectedDoc}
        onClose={() => {
          setViewerVisible(false);
          setSelectedDoc(null);
        }}
      />

      <CustomerEditor
        visible={ledger.activeModal === "customer"}
        busy={ledger.busy}
        isEditing={Boolean(ledger.editingCustomerId)}
        values={ledger.customerForm}
        onChange={ledger.setCustomerForm}
        onClose={ledger.closeModal}
        onSave={ledger.submitCustomer}
      />
      <VehicleEditor
        visible={ledger.activeModal === "vehicle"}
        busy={ledger.busy}
        values={ledger.vehicleForm}
        onChange={ledger.setVehicleForm}
        onClose={ledger.closeModal}
        onSave={ledger.submitVehicle}
      />
      <LoanEditor
        visible={ledger.activeModal === "loan"}
        busy={ledger.busy}
        values={ledger.loanForm}
        onChange={ledger.setLoanForm}
        onClose={ledger.closeModal}
        onSave={ledger.submitLoan}
      />
      <PaymentEditor
        visible={ledger.activeModal === "payment"}
        busy={ledger.busy}
        values={ledger.paymentForm}
        onChange={ledger.setPaymentForm}
        onClose={ledger.closeModal}
        onSave={ledger.submitPayment}
      />
      <DocumentEditor
        visible={ledger.activeModal === "document"}
        busy={ledger.busy}
        values={ledger.documentForm}
        onChange={ledger.setDocumentForm}
        onClose={ledger.closeModal}
        onSave={ledger.submitDocument}
      />
    </SafeAreaView>
  );
}
