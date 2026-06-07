import React from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { styles } from "../../styles/appStyles";
import { Customer, DatabaseAppState, Loan, Vehicle } from "../../types";
import { toneClass } from "../../utils/display";
import { formatCurrency, formatDate, getLoanSummary, groupPayments } from "../../utils/loanMath";
import { DetailHeader, LoanDetailCard, ScreenList, Section, StatGrid } from "./components";

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
      <StatGrid dashboard={state.dashboard} />
      <Section title="Due soon">
        {state.loans.slice(0, 5).map((loan) => {
          const summary = getLoanSummary(
            loan,
            state.payments.filter((payment) => payment.loanId === loan.id),
            customerForLoan(loan.id),
          );

          return (
            <Pressable key={loan.id} style={styles.listRow} onPress={() => onOpenLoan(loan.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{loan.loanCode}</Text>
                <Text style={styles.rowSub}>{summary.customerName || "Customer"}</Text>
              </View>
              <Text style={[styles.risk, toneClass(summary.tone)]}>{summary.dueLabel}</Text>
            </Pressable>
          );
        })}
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
      actionLabel="Add customer"
      onAction={onCreate}
      items={customers}
      emptyText="No customers yet."
      renderItem={(customer) => (
        <Pressable key={customer.id} style={styles.listRow} onPress={() => onSelect(customer.id)}>
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
      actionLabel="Add loan"
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
          <Pressable key={loan.id} style={styles.listRow} onPress={() => onSelect(loan.id)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{loan.loanCode}</Text>
              <Text style={styles.rowSub}>
                {summary.customerName || "Customer"} - {summary.vehicleLabel}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.rowAmount}>{formatCurrency(summary.balance)}</Text>
              <Text style={[styles.risk, toneClass(summary.tone)]}>{summary.statusLabel}</Text>
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
          <Pressable key={customer.id} style={styles.listRow} onPress={() => onSelectCustomer(customer.id)}>
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
          <Pressable key={loan.id} style={styles.listRow} onPress={() => onSelectLoan(loan.id)}>
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

export function SettingsScreen({ busy, onReset }: { busy: boolean; onReset: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Section title="Local storage">
        <Text style={styles.bodyText}>
          The app currently stores customers, vehicles, loans, payments, and documents in SQLite on this
          device.
        </Text>
        <Pressable style={styles.secondaryButton} onPress={onReset} disabled={busy}>
          <Text style={styles.secondaryButtonText}>Clear demo data</Text>
        </Pressable>
      </Section>
      <Section title="Current scope">
        <Text style={styles.bodyText}>
          Customers, vehicles, document vault entries, loan creation, payment tracking, due-date summaries,
          dashboard metrics, and search are all handled locally.
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
}: {
  customer: Customer;
  state: DatabaseAppState;
  onBack: () => void;
  onEdit: () => void;
  onAddVehicle: () => void;
  onAddDocument: () => void;
  onAddLoan: () => void;
  onSelectLoan: (loanId: string) => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <DetailHeader
        title={customer.fullName}
        subtitle={customer.mobileNumber}
        onBack={onBack}
        onEdit={onEdit}
        onAddVehicle={onAddVehicle}
        onAddDocument={onAddDocument}
      />

      <Section title="Profile">
        <Text style={styles.bodyText}>{customer.address || "No address recorded."}</Text>
        <Text style={styles.bodyText}>{customer.notes || "No notes recorded."}</Text>
      </Section>

      <Section title={`Vehicles (${customer.vehicles.length})`} actionLabel="Add vehicle" onAction={onAddVehicle}>
        {customer.vehicles.map((vehicle) => (
          <Pressable key={vehicle.id} style={styles.listRow} onPress={() => onAddLoan()}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{vehicle.registrationNumber}</Text>
              <Text style={styles.rowSub}>
                {vehicle.make} {vehicle.model} {vehicle.year}
              </Text>
            </View>
            <Text style={styles.chevron}>+</Text>
          </Pressable>
        ))}
      </Section>

      <Section title={`Loans (${customer.loans.length})`} actionLabel="Add loan" onAction={onAddLoan}>
        {customer.loans.map((loan) => {
          const summary = getLoanSummary(
            loan,
            state.payments.filter((payment) => payment.loanId === loan.id),
            customer,
          );

          return (
            <Pressable key={loan.id} style={styles.listRow} onPress={() => onSelectLoan(loan.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{loan.loanCode}</Text>
                <Text style={styles.rowSub}>{formatCurrency(summary.balance)} remaining</Text>
              </View>
              <Text style={[styles.risk, toneClass(summary.tone)]}>{summary.dueLabel}</Text>
            </Pressable>
          );
        })}
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
      <DetailHeader title={loan.loanCode} subtitle={loan.status} onBack={onBack} onAddPayment={onAddPayment} />
      <LoanDetailCard loan={loan} payments={payments} customer={customer} />

      <Section title="Payments" actionLabel="Add payment" onAction={onAddPayment}>
        {groupPayments(payments).map((group) => (
          <View key={group.label} style={styles.groupBlock}>
            <Text style={styles.groupTitle}>{group.label}</Text>
            {group.items.map((payment) => (
              <View key={payment.id} style={styles.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{payment.paymentType}</Text>
                  <Text style={styles.rowSub}>{formatDate(payment.paymentDate)}</Text>
                </View>
                <Text style={styles.rowAmount}>{formatCurrency(payment.amount)}</Text>
              </View>
            ))}
          </View>
        ))}
      </Section>
    </ScrollView>
  );
}
