import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { styles } from "../../styles/appStyles";
import { Customer, DatabaseAppState, Loan, Vehicle } from "../../types";
import { toneClass } from "../../utils/display";
import {
  formatCurrency,
  formatDate,
  getLoanSummary,
  groupPayments,
  getMonthwiseInterestSummary,
} from "../../utils/loanMath";
import {
  Avatar,
  DetailHeader,
  LoanDetailCard,
  ScreenList,
  Section,
  StatGrid,
} from "./components";
import { DropdownPicker } from "./forms";

function getCollateralPhoto(photoUrisJson: string) {
  try {
    const uris = JSON.parse(photoUrisJson || "[]");
    return uris[0] || "";
  } catch {
    return "";
  }
}

function formatMonthLabel(monthPrefix: string) {
  const [year, month] = monthPrefix.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function DashboardScreen({
  state,
  customerForLoan,
  onOpenLoan,
}: {
  state: DatabaseAppState;
  customerForLoan: (loanId: string) => Customer | undefined;
  onOpenLoan: (loanId: string) => void;
}) {
  const [selectedMonth, setSelectedMonth] = React.useState(() =>
    new Date().toISOString().slice(0, 7),
  );

  const monthOptions = React.useMemo(() => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      options.push(d.toISOString().slice(0, 7));
    }
    return options;
  }, []);

  const { paid, unpaid } = React.useMemo(() => {
    return getMonthwiseInterestSummary(
      state.loans,
      state.payments,
      selectedMonth,
    );
  }, [state.loans, state.payments, selectedMonth]);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <StatGrid dashboard={state.dashboard} />

      {/* Month-wise collection status panel (Calculates automatically) */}
      <Section title="Interest Status By Month">
        <Text style={[styles.rowSub, { marginBottom: 10 }]}>
          Select a calendar month to view interest collection status.
        </Text>

        <DropdownPicker
          options={monthOptions.map((m) => ({
            label: formatMonthLabel(m),
            value: m,
          }))}
          selectedValue={selectedMonth}
          onSelect={setSelectedMonth}
          placeholder="Select month"
        />

        <View style={{ gap: 12 }}>
          <View>
            <Text
              style={[styles.groupTitle, { color: "#16a34a", marginBottom: 6 }]}
            >
              Paid ({paid.length})
            </Text>
            {paid.length === 0 ? (
              <Text
                style={[
                  styles.bodyText,
                  { fontSize: 13, fontStyle: "italic", marginLeft: 6 },
                ]}
              >
                No interest payments recorded for this month.
              </Text>
            ) : (
              paid.map((loan) => {
                const customer = customerForLoan(loan.id);
                return (
                  <Pressable
                    key={loan.id}
                    style={[
                      styles.listRow,
                      { paddingVertical: 8, marginBottom: 6 },
                    ]}
                    onPress={() => onOpenLoan(loan.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { fontSize: 14 }]}>
                        {loan.loanCode}
                      </Text>
                      <Text style={styles.rowSub}>
                        {customer?.fullName || "Customer"}
                      </Text>
                    </View>
                    <Text style={[styles.risk, styles.risk_green]}>Paid</Text>
                  </Pressable>
                );
              })
            )}
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#f1f5f9",
              paddingTop: 10,
            }}
          >
            <Text
              style={[styles.groupTitle, { color: "#dc2626", marginBottom: 6 }]}
            >
              Pending / Unpaid ({unpaid.length})
            </Text>
            {unpaid.length === 0 ? (
              <Text
                style={[
                  styles.bodyText,
                  { fontSize: 13, fontStyle: "italic", marginLeft: 6 },
                ]}
              >
                All active loans are paid for this month!
              </Text>
            ) : (
              unpaid.map((loan) => {
                const customer = customerForLoan(loan.id);
                return (
                  <Pressable
                    key={loan.id}
                    style={[
                      styles.listRow,
                      { paddingVertical: 8, marginBottom: 6 },
                    ]}
                    onPress={() => onOpenLoan(loan.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { fontSize: 14 }]}>
                        {loan.loanCode}
                      </Text>
                      <Text style={styles.rowSub}>
                        {customer?.fullName || "Customer"}
                      </Text>
                    </View>
                    <Text style={[styles.risk, styles.risk_red]}>Pending</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </Section>

      <Section title="Due soon">
        {state.loans.length === 0 ? (
          <Text style={styles.bodyText}>No active loans found.</Text>
        ) : (
          state.loans.slice(0, 5).map((loan) => {
            const summary = getLoanSummary(
              loan,
              state.payments.filter((payment) => payment.loanId === loan.id),
              customerForLoan(loan.id),
            );

            return (
              <Pressable
                key={loan.id}
                style={styles.listRow}
                onPress={() => onOpenLoan(loan.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{loan.loanCode}</Text>
                  <Text style={styles.rowSub}>
                    {summary.customerName || "Customer"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.risk, toneClass(summary.tone)]}>
                    {summary.dueLabel}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </Section>
    </ScrollView>
  );
}

export function CustomersScreen({
  customers,
  onCreate,
  onSelect,
}: {
  customers: Customer[];
  onCreate: () => void;
  onSelect: (customerId: string) => void;
}) {
  return (
    <ScreenList
      title="Customers"
      actionLabel="+ Add customer"
      onAction={onCreate}
      items={customers}
      emptyText="No customers yet."
      renderItem={(customer) => (
        <Pressable
          key={customer.id}
          style={styles.listRow}
          onPress={() => onSelect(customer.id)}
        >
          <Avatar name={customer.fullName} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{customer.fullName}</Text>
            <Text style={styles.rowSub}>{customer.mobileNumber}</Text>
          </View>
          <Text style={styles.chevron}>{">"}</Text>
        </Pressable>
      )}
    />
  );
}

export function LoansScreen({
  state,
  customerForLoan,
  onCreate,
  onSelect,
}: {
  state: DatabaseAppState;
  customerForLoan: (loanId: string) => Customer | undefined;
  onCreate: () => void;
  onSelect: (loanId: string) => void;
}) {
  return (
    <ScreenList
      title="Loans"
      actionLabel="+ Add loan"
      onAction={onCreate}
      items={state.loans}
      emptyText="No loans yet."
      renderItem={(loan) => {
        const summary = getLoanSummary(
          loan,
          state.payments.filter((payment) => payment.loanId === loan.id),
          customerForLoan(loan.id),
        );

        return (
          <Pressable
            key={loan.id}
            style={styles.listRow}
            onPress={() => onSelect(loan.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{loan.loanCode}</Text>
              <Text style={styles.rowSub}>
                {summary.customerName || "Customer"}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>
                {formatCurrency(summary.balance)}
              </Text>
              <Text style={[styles.risk, toneClass(summary.tone)]}>
                {summary.statusLabel}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

export function SearchScreen({
  query,
  results,
  onQueryChange,
  onSelectCustomer,
  onSelectLoan,
}: {
  query: string;
  results: { customers: Customer[]; vehicles: Vehicle[]; loans: Loan[] };
  onQueryChange: (value: string) => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectLoan: (loanId: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Section title="Search everything">
        <TextInput
          style={styles.input}
          placeholder="Name, mobile, registration, loan code"
          value={query}
          onChangeText={onQueryChange}
        />
      </Section>

      <Section title={`Customers (${results.customers.length})`}>
        {results.customers.map((customer) => (
          <Pressable
            key={customer.id}
            style={styles.listRow}
            onPress={() => onSelectCustomer(customer.id)}
          >
            <Avatar name={customer.fullName} />
            <Text style={styles.rowTitle}>{customer.fullName}</Text>
          </Pressable>
        ))}
      </Section>

      <Section title={`Collateral (${results.vehicles.length})`}>
        {results.vehicles.map((col) => (
          <View key={col.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>
                {col.vehicleType === "Bike" || col.vehicleType === "Car"
                  ? col.registrationNumber
                  : `${col.vehicleType} (${col.make})`}
              </Text>
              <Text style={styles.rowSub}>
                {col.make} {col.model}
              </Text>
            </View>
          </View>
        ))}
      </Section>

      <Section title={`Loans (${results.loans.length})`}>
        {results.loans.map((loan) => (
          <Pressable
            key={loan.id}
            style={styles.listRow}
            onPress={() => onSelectLoan(loan.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{loan.loanCode}</Text>
              <Text style={styles.rowSub}>{loan.status}</Text>
            </View>
          </Pressable>
        ))}
      </Section>
    </ScrollView>
  );
}

export function SettingsScreen({
  busy,
  onReset,
}: {
  busy: boolean;
  onReset: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Section title="Local storage">
        <Text style={styles.bodyText}>
          The app currently stores customers, vehicles, loans, payments, and
          documents in SQLite on this device.
        </Text>
        <View style={{ marginTop: 12 }}>
          <Pressable
            style={styles.secondaryButton}
            onPress={onReset}
            disabled={busy}
          >
            <Text style={styles.secondaryButtonText}>Clear demo data</Text>
          </Pressable>
        </View>
      </Section>
    </ScrollView>
  );
}

export function CustomerDetailScreen({
  customer,
  state,
  onBack,
  onEdit,
  onAddVehicle,
  onAddDocument,
  onAddLoan,
  onSelectLoan,
  onViewDocument,
}: {
  customer: Customer;
  state: DatabaseAppState;
  onBack: () => void;
  onEdit: () => void;
  onAddVehicle: () => void;
  onAddDocument: () => void;
  onAddLoan: () => void;
  onSelectLoan: (loanId: string) => void;
  onViewDocument: (doc: any) => void;
}) {
  const documents = state.documents.filter(
    (doc) => doc.customerId === customer.id,
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <DetailHeader
        title={customer.fullName.split(" ")[0]}
        subtitle={customer.mobileNumber}
        onBack={onBack}
        backLabel="Customers"
        onEdit={onEdit}
      />

      <Section title="Profile Info">
        <View style={{ gap: 6 }}>
          {customer.alternateMobileNumber ? (
            <Text style={styles.bodyText}>
              Alt Phone: {customer.alternateMobileNumber}
            </Text>
          ) : null}
          <Text style={styles.bodyText}>
            Address: {customer.address || "No address recorded."}
          </Text>
          <Text style={styles.bodyText}>
            Notes: {customer.notes || "No notes recorded."}
          </Text>
        </View>
      </Section>

      <Section
        title={`Collateral (${customer.vehicles.length})`}
        actionLabel="+ Add collateral"
        onAction={onAddVehicle}
      >
        {customer.vehicles.length === 0 ? (
          <Text style={styles.bodyText}>No collateral recorded.</Text>
        ) : (
          customer.vehicles.map((col) => {
            const photo = getCollateralPhoto(col.photoUrisJson);
            const isVehicle =
              col.vehicleType === "Bike" || col.vehicleType === "Car";
            const colLabel = isVehicle
              ? `${col.registrationNumber} (${col.make} ${col.model})`
              : `${col.make} - ${col.model} (${col.chassisNumber || "No serial"})`;

            return (
              <View key={col.id} style={styles.listRow}>
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 6,
                      marginRight: 4,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 6,
                      backgroundColor: "#ccfbf1",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 4,
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>📦</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{col.vehicleType}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>
                    {colLabel}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.secondaryButton,
                    { paddingVertical: 6, paddingHorizontal: 10 },
                  ]}
                  onPress={() => onAddLoan()}
                >
                  <Text style={styles.secondaryButtonText}>+ Loan</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </Section>

      <Section
        title={`Loans (${customer.loans.length})`}
        actionLabel="+ Add loan"
        onAction={onAddLoan}
      >
        {customer.loans.length === 0 ? (
          <Text style={styles.bodyText}>No loans recorded.</Text>
        ) : (
          customer.loans.map((loan) => {
            const summary = getLoanSummary(
              loan,
              state.payments.filter((payment) => payment.loanId === loan.id),
              customer,
            );

            return (
              <Pressable
                key={loan.id}
                style={styles.listRow}
                onPress={() => onSelectLoan(loan.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{loan.loanCode}</Text>
                  <Text style={styles.rowSub}>
                    {formatCurrency(summary.balance)} outstanding
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.risk, toneClass(summary.tone)]}>
                    {summary.statusLabel}
                  </Text>
                  <Text style={[styles.rowSub, { marginTop: 4 }]}>
                    {summary.dueLabel}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}
      </Section>

      <Section
        title={`Document Vault (${documents.length})`}
        actionLabel="+ Add document"
        onAction={onAddDocument}
      >
        {documents.length === 0 ? (
          <Text style={styles.bodyText}>No documents uploaded yet.</Text>
        ) : (
          <View style={styles.docGrid}>
            {documents.map((doc) => {
              const isImage =
                doc.fileUri &&
                (doc.fileUri.startsWith("data:image/") ||
                  doc.fileUri.toLowerCase().endsWith(".png") ||
                  doc.fileUri.toLowerCase().endsWith(".jpg") ||
                  doc.fileUri.toLowerCase().endsWith(".jpeg") ||
                  doc.fileUri.toLowerCase().endsWith(".webp"));

              return (
                <Pressable
                  key={doc.id}
                  style={styles.docCard}
                  onPress={() => onViewDocument(doc)}
                >
                  {isImage ? (
                    <Image
                      source={{ uri: doc.fileUri }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <Text style={styles.docIconText}>📄</Text>
                  )}
                  <Text style={styles.docTitle} numberOfLines={1}>
                    {doc.documentType}
                  </Text>
                  <Text style={styles.docSub} numberOfLines={1}>
                    {doc.documentNumber}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Section>
    </ScrollView>
  );
}

export function LoanDetailScreen({
  loan,
  payments,
  customer,
  onBack,
  onAddPayment,
}: {
  loan: Loan;
  payments: DatabaseAppState["payments"];
  customer?: Customer;
  onBack: () => void;
  onAddPayment: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <DetailHeader
        title={loan.loanCode}
        subtitle={loan.status}
        onBack={onBack}
        backLabel="Loans"
        onAddPayment={onAddPayment}
      />
      <LoanDetailCard loan={loan} payments={payments} customer={customer} />

      <Section
        title="Payments"
        actionLabel="Add payment"
        onAction={onAddPayment}
      >
        {payments.length === 0 ? (
          <Text style={styles.bodyText}>No payments recorded yet.</Text>
        ) : (
          groupPayments(payments).map((group) => (
            <View key={group.label} style={styles.groupBlock}>
              <Text style={styles.groupTitle}>{group.label}</Text>
              {group.items.map((payment) => (
                <View key={payment.id} style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{payment.paymentType}</Text>
                    <Text style={styles.rowSub}>
                      {formatDate(payment.paymentDate)}
                    </Text>
                  </View>
                  <Text style={styles.rowAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}
