/**
 * @file Reusable UI components — Avatar, PressableScale, Section, ScreenList,
 *       DetailHeader, BottomBar, StatGrid, LoanDetailCard.
 */

import React from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";

import { styles, THEME } from "../../styles/appStyles";
import { Customer, DatabaseAppState, Loan } from "../../types";
import { toneClass } from "../../utils/display";
import { formatCurrency, getLoanSummary } from "../../utils/loanMath";

/**
 * Extract initials (max 2 chars) from a full name.
 *
 * @param name - The full name string.
 * @returns Uppercase initials (e.g. "JD" for "John Doe").
 */
export function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Circular avatar showing the initials of a name.
 *
 * @param props.name - The display name.
 */
export function Avatar({ name }: { name: string }) {
    const initials = getInitials(name);
    return (
        <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
        </View>
    );
}

export const AvatarMemo = React.memo(Avatar);

/**
 * A Pressable wrapper that reduces opacity on press for tactile feedback.
 * Accepts all standard Pressable props via the spread.
 */
export function PressableScale({
    style,
    onPress,
    children,
    disabled,
    ...props
}: {
    style?: any;
    onPress?: () => void;
    children: React.ReactNode;
    disabled?: boolean;
    [key: string]: any;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, style]}
            {...props}
        >
            {children}
        </Pressable>
    );
}

/**
 * Card-like section container with an optional title and action button.
 */
export const Section = React.memo(function Section({
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
                    <PressableScale style={styles.secondaryButton} onPress={onAction}>
                        <Text style={styles.secondaryButtonText}>{actionLabel}</Text>
                    </PressableScale>
                ) : null}
            </View>
            <View style={styles.sectionBody}>{children}</View>
        </View>
    );
});

/**
 * Generic scrollable list screen with title, action button, empty state,
 * and optional pull-to-refresh.
 */
export function ScreenList<T>({
    title,
    actionLabel,
    onAction,
    items,
    emptyText,
    renderItem,
    refreshing,
    onRefresh,
}: {
    title: string;
    actionLabel: string;
    onAction: () => void;
    items: T[];
    emptyText: string;
    renderItem: (item: T) => React.ReactNode;
    refreshing?: boolean;
    onRefresh?: () => void;
}) {
    return (
        <ScrollView
            contentContainerStyle={styles.scroll}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing ?? false}
                        onRefresh={onRefresh}
                        colors={[THEME.colors.primary]}
                        tintColor={THEME.colors.primary}
                    />
                ) : undefined
            }
        >
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

/**
 * Teal header bar shown on customer/loan detail screens with back nav
 * and action buttons (Edit, +Collateral, +Document, +Payment).
 */
export const DetailHeader = React.memo(function DetailHeader({
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
            <PressableScale style={styles.headerButton} onPress={onBack}>
                <Text style={styles.headerButtonText}>← {backLabel}</Text>
            </PressableScale>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={styles.detailTitle} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.detailSub} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            <View style={styles.detailActions}>
                {onEdit ? (
                    <PressableScale style={styles.headerButton} onPress={onEdit}>
                        <Text style={styles.headerButtonText}>Edit</Text>
                    </PressableScale>
                ) : null}
                {onAddVehicle ? (
                    <PressableScale style={styles.headerButton} onPress={onAddVehicle}>
                        <Text style={styles.headerButtonText}>+ Collateral</Text>
                    </PressableScale>
                ) : null}
                {onAddDocument ? (
                    <PressableScale style={styles.headerButton} onPress={onAddDocument}>
                        <Text style={styles.headerButtonText}>+ Document</Text>
                    </PressableScale>
                ) : null}
                {onAddPayment ? (
                    <PressableScale style={styles.headerButton} onPress={onAddPayment}>
                        <Text style={styles.headerButtonText}>+ Payment</Text>
                    </PressableScale>
                ) : null}
            </View>
        </View>
    );
});

/**
 * Floating bottom navigation bar with Dashboard / Customers / Loans / Search tabs.
 */
export function BottomBar({
    activeTab,
    onTabPress,
}: {
    activeTab: string;
    onTabPress: (tab: any) => void;
}) {
    const tabs = [
        { name: "dashboard", label: "Dashboard", icon: "🏠" },
        { name: "customers", label: "Customers", icon: "👥" },
        { name: "loans", label: "Loans", icon: "💰" },
        { name: "search", label: "Search", icon: "🔍" },
    ];

    return (
        <View style={styles.bottomBar}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.name;
                return (
                    <PressableScale
                        key={tab.name}
                        style={[styles.bottomAction, isActive && styles.bottomActionActive]}
                        onPress={() => onTabPress(tab.name)}
                    >
                        <Text style={{ fontSize: 18, marginBottom: 2 }}>{tab.icon}</Text>
                        <Text style={styles.bottomActionText}>{tab.label}</Text>
                    </PressableScale>
                );
            })}
        </View>
    );
}

/**
 * 2-column dashboard stat cards showing aggregated financial numbers.
 */
export const StatGrid = React.memo(function StatGrid({
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
});

/**
 * Detailed summary card for a single loan showing outstanding amounts and status.
 */
export const LoanDetailCard = React.memo(function LoanDetailCard({
    loan,
    payments,
    customer,
}: {
    loan: Loan;
    payments: DatabaseAppState["payments"];
    customer?: Customer;
}) {
    const summary = getLoanSummary(loan, payments, customer);
    const vehicleLabel = customer?.vehicles.find((v) => v.id === loan.vehicleId) ?? null;
    const collateralLabel = vehicleLabel
        ? vehicleLabel.vehicleType === "Bike" || vehicleLabel.vehicleType === "Car"
            ? `${vehicleLabel.registrationNumber} (${vehicleLabel.make} ${vehicleLabel.model})`
            : `${vehicleLabel.vehicleType} — ${vehicleLabel.make} ${vehicleLabel.model}`
        : loan.vehicleId;

    return (
        <View style={styles.detailCard}>
            <Text style={styles.detailCardTitle}>Loan Summary</Text>
            <Text style={styles.bodyText}>
                Customer: {summary.customerName || "Unlinked customer"}
            </Text>
            <Text style={styles.bodyText}>Collateral: {collateralLabel}</Text>
            <Text style={styles.bodyText}>
                Principal outstanding: {formatCurrency(summary.principalOutstanding)}
            </Text>
            <Text style={styles.bodyText}>Interest due: {formatCurrency(summary.interestDue)}</Text>
            <Text style={styles.bodyText}>Total balance: {formatCurrency(summary.balance)}</Text>
            <Text style={styles.bodyText}>Next due: {summary.dueLabel}</Text>
            <View style={{ marginTop: 12, alignItems: "flex-start" }}>
                <Text style={[styles.risk, toneClass(summary.tone)]}>{summary.statusLabel}</Text>
            </View>
        </View>
    );
});
