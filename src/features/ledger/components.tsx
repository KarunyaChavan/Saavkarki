import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { styles } from "../../styles/appStyles";
import { Customer, DatabaseAppState, Loan } from "../../types";
import { toneClass } from "../../utils/display";
import { formatCurrency, getLoanSummary } from "../../utils/loanMath";

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function Avatar({ name }: { name: string }) {
  const initials = getInitials(name);
  return (
    <View style={styles.avatarCircle}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {actionLabel && onAction ? (
          <Pressable style={styles.secondaryButton} onPress={onAction}>
            <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export function ScreenList<T>({
  title,
  actionLabel,
  onAction,
  items,
  emptyText,
  renderItem,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  items: T[];
  emptyText: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Section title={title} actionLabel={actionLabel} onAction={onAction}>
        {items.length === 0 ? (
          <Text style={styles.bodyText}>{emptyText}</Text>
        ) : (
          items.map(renderItem)
        )}
      </Section>
    </ScrollView>
  );
}

export function DetailHeader({
  title,
  subtitle,
  onBack,
  onEdit,
  onAddVehicle,
  onAddDocument,
  onAddPayment,
  backLabel = "Back",
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onEdit?: () => void;
  onAddVehicle?: () => void;
  onAddDocument?: () => void;
  onAddPayment?: () => void;
  backLabel?: string;
}) {
  return (
    <View style={styles.detailHeader}>
      <Pressable style={styles.secondaryButton} onPress={onBack}>
        <Text style={styles.secondaryButtonText}>← {backLabel}</Text>
      </Pressable>
      <View style={{ flex: 1, paddingHorizontal: 12 }}>
        <Text style={styles.detailTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.detailActions}>
        {onEdit ? (
          <Pressable style={styles.secondaryButton} onPress={onEdit}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </Pressable>
        ) : null}
        {onAddVehicle ? (
          <Pressable style={styles.secondaryButton} onPress={onAddVehicle}>
            <Text style={styles.secondaryButtonText}>+ Vehicle</Text>
          </Pressable>
        ) : null}
        {onAddDocument ? (
          <Pressable style={styles.secondaryButton} onPress={onAddDocument}>
            <Text style={styles.secondaryButtonText}>+ Doc</Text>
          </Pressable>
        ) : null}
        {onAddPayment ? (
          <Pressable style={styles.secondaryButton} onPress={onAddPayment}>
            <Text style={styles.secondaryButtonText}>+ Payment</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function BottomBar({
  onCreateCustomer,
  onCreateLoan,
  onCreateDocument,
}: {
  onCreateCustomer: () => void;
  onCreateLoan: () => void;
  onCreateDocument: () => void;
}) {
  return (
    <View style={styles.bottomBar}>
      <Pressable style={styles.bottomAction} onPress={onCreateCustomer}>
        <Text style={styles.bottomActionText}>+ Customer</Text>
      </Pressable>
      <Pressable style={styles.bottomAction} onPress={onCreateLoan}>
        <Text style={styles.bottomActionText}>+ Loan</Text>
      </Pressable>
      <Pressable style={styles.bottomAction} onPress={onCreateDocument}>
        <Text style={styles.bottomActionText}>+ Document</Text>
      </Pressable>
    </View>
  );
}

export function StatGrid({
  dashboard,
}: {
  dashboard: DatabaseAppState["dashboard"] | undefined;
}) {
  const items: {
    label: string;
    value: number;
    isCount?: boolean;
    borderLeftColor?: string;
  }[] = [
    {
      label: "Total lent",
      value: dashboard?.totalMoneyLent ?? 0,
      borderLeftColor: "#0f766e",
    },
    {
      label: "Outstanding principal",
      value: dashboard?.totalOutstandingPrincipal ?? 0,
      borderLeftColor: "#2563eb",
    },
    {
      label: "Interest collected",
      value: dashboard?.totalInterestCollected ?? 0,
      borderLeftColor: "#16a34a",
    },
    {
      label: "Active loans",
      value: dashboard?.activeLoans ?? 0,
      isCount: true,
      borderLeftColor: "#0f766e",
    },
    {
      label: "Overdue loans",
      value: dashboard?.overdueLoans ?? 0,
      isCount: true,
      borderLeftColor: "#d97706",
    },
    {
      label: "Defaulted loans",
      value: dashboard?.defaultedLoans ?? 0,
      isCount: true,
      borderLeftColor: "#dc2626",
    },
  ];

  return (
    <View style={styles.statGrid}>
      {items.map((item) => (
        <View
          key={item.label}
          style={[styles.statCard, { borderLeftColor: item.borderLeftColor }]}
        >
          <Text style={styles.statLabel}>{item.label}</Text>
          <Text style={styles.statValue}>
            {item.isCount ? item.value : formatCurrency(item.value)}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LoanDetailCard({
  loan,
  payments,
  customer,
}: {
  loan: Loan;
  payments: DatabaseAppState["payments"];
  customer?: Customer;
}) {
  const summary = getLoanSummary(loan, payments, customer);

  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailCardTitle}>Loan summary</Text>
      <Text style={styles.bodyText}>
        Customer: {summary.customerName || "Unlinked customer"}
      </Text>
      <Text style={styles.bodyText}>Vehicle: {summary.vehicleLabel}</Text>
      <Text style={styles.bodyText}>
        Principal: {formatCurrency(summary.principalOutstanding)}
      </Text>
      <Text style={styles.bodyText}>
        Interest due: {formatCurrency(summary.interestDue)}
      </Text>
      <Text style={styles.bodyText}>
        Balance: {formatCurrency(summary.balance)}
      </Text>
      <Text style={styles.bodyText}>Next due: {summary.dueLabel}</Text>
      <View style={{ marginTop: 12, alignItems: "flex-start" }}>
        <Text style={[styles.risk, toneClass(summary.tone)]}>
          {summary.statusLabel}
        </Text>
      </View>
    </View>
  );
}
