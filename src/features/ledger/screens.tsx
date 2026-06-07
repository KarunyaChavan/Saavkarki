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
} from "../../utils/loanMath";
import {
  Avatar,
  DetailHeader,
  LoanDetailCard,
  ScreenList,
  Section,
  StatGrid,
} from "./components";

export function DashboardScreen({
  state,
  customerForLoan,
  onOpenLoan,
}: {
  state: DatabaseAppState;
  customerForLoan: (loanId: string) => Customer | undefined;
  onOpenLoan: (loanId: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
          Welcome back!
        </Text>
        <Text style={{ fontSize: 13, color: "#64748b" }}>
          Here is the summary of your lending portfolio.
        </Text>
      </View>
      <StatGrid dashboard={state.dashboard} />
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
                {summary.customerName || "Customer"} - {summary.vehicleLabel}
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

      <Section title={`Vehicles (${results.vehicles.length})`}>
        {results.vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{vehicle.registrationNumber}</Text>
              <Text style={styles.rowSub}>
                {vehicle.make} {vehicle.model}
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
      <Section title="Current scope">
        <Text style={styles.bodyText}>
          Customers, vehicles, document vault entries, loan creation, payment
          tracking, due-date summaries, dashboard metrics, and search are all
          handled locally.
        </Text>
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
        title={customer.fullName}
        subtitle={customer.mobileNumber}
        onBack={onBack}
        backLabel="Customers"
        onEdit={onEdit}
        onAddVehicle={onAddVehicle}
        onAddDocument={onAddDocument}
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
        title={`Vehicles (${customer.vehicles.length})`}
        actionLabel="+ Add vehicle"
        onAction={onAddVehicle}
      >
        {customer.vehicles.length === 0 ? (
          <Text style={styles.bodyText}>No vehicles recorded.</Text>
        ) : (
          customer.vehicles.map((vehicle) => (
            <View key={vehicle.id} style={styles.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>
                  {vehicle.registrationNumber} ({vehicle.vehicleType})
                </Text>
                <Text style={styles.rowSub}>
                  {vehicle.make} {vehicle.model} - {vehicle.year} (
                  {vehicle.color})
                </Text>
              </View>
              <Pressable
                style={[
                  styles.secondaryButton,
                  { paddingVertical: 6, paddingHorizontal: 10 },
                ]}
                onPress={() => onAddLoan()}
              >
                <Text style={styles.secondaryButtonText}>Create Loan</Text>
              </Pressable>
            </View>
          ))
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
