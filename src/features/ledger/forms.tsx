import React from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { styles } from "../../styles/appStyles";
import {
  CustomerFormValues,
  DocumentFormValues,
  LoanFormValues,
  PaymentFormValues,
  Vehicle,
} from "../../types";

function EditorSheet({
  title,
  onClose,
  onSave,
  busy,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  busy: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {children}
        </ScrollView>
        <Pressable style={styles.primaryButton} onPress={onSave} disabled={busy}>
          <Text style={styles.primaryButtonText}>{busy ? "Saving..." : "Save"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

export function CustomerEditor({
  visible,
  busy,
  isEditing,
  values,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  isEditing: boolean;
  values: CustomerFormValues;
  onChange: React.Dispatch<React.SetStateAction<CustomerFormValues>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet title={isEditing ? "Edit customer" : "New customer"} onClose={onClose} onSave={onSave} busy={busy}>
        <FormField label="Full name">
          <TextInput style={styles.input} value={values.fullName} onChangeText={(fullName) => onChange((prev) => ({ ...prev, fullName }))} />
        </FormField>
        <FormField label="Mobile number">
          <TextInput style={styles.input} keyboardType="phone-pad" value={values.mobileNumber} onChangeText={(mobileNumber) => onChange((prev) => ({ ...prev, mobileNumber }))} />
        </FormField>
        <FormField label="Alternate mobile">
          <TextInput style={styles.input} keyboardType="phone-pad" value={values.alternateMobileNumber} onChangeText={(alternateMobileNumber) => onChange((prev) => ({ ...prev, alternateMobileNumber }))} />
        </FormField>
        <FormField label="Address">
          <TextInput style={[styles.input, styles.textArea]} multiline value={values.address} onChangeText={(address) => onChange((prev) => ({ ...prev, address }))} />
        </FormField>
        <FormField label="Notes">
          <TextInput style={[styles.input, styles.textArea]} multiline value={values.notes} onChangeText={(notes) => onChange((prev) => ({ ...prev, notes }))} />
        </FormField>
      </EditorSheet>
    </Modal>
  );
}

export function VehicleEditor({
  visible,
  busy,
  values,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  values: Vehicle;
  onChange: React.Dispatch<React.SetStateAction<Vehicle>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet title="New vehicle" onClose={onClose} onSave={onSave} busy={busy}>
        <FormField label="Vehicle type">
          <TextInput style={styles.input} value={values.vehicleType} onChangeText={(vehicleType) => onChange((prev) => ({ ...prev, vehicleType }))} />
        </FormField>
        <FormField label="Registration number">
          <TextInput style={styles.input} value={values.registrationNumber} onChangeText={(registrationNumber) => onChange((prev) => ({ ...prev, registrationNumber }))} />
        </FormField>
        <FormField label="Make">
          <TextInput style={styles.input} value={values.make} onChangeText={(make) => onChange((prev) => ({ ...prev, make }))} />
        </FormField>
        <FormField label="Model">
          <TextInput style={styles.input} value={values.model} onChangeText={(model) => onChange((prev) => ({ ...prev, model }))} />
        </FormField>
        <FormField label="Year">
          <TextInput style={styles.input} value={values.year} onChangeText={(year) => onChange((prev) => ({ ...prev, year }))} />
        </FormField>
      </EditorSheet>
    </Modal>
  );
}

export function LoanEditor({
  visible,
  busy,
  values,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  values: LoanFormValues;
  onChange: React.Dispatch<React.SetStateAction<LoanFormValues>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet title="New loan" onClose={onClose} onSave={onSave} busy={busy}>
        <FormField label="Principal amount">
          <TextInput style={styles.input} keyboardType="numeric" value={values.principalAmount} onChangeText={(principalAmount) => onChange((prev) => ({ ...prev, principalAmount }))} />
        </FormField>
        <FormField label="Interest rate % per month">
          <TextInput style={styles.input} keyboardType="numeric" value={values.interestRate} onChangeText={(interestRate) => onChange((prev) => ({ ...prev, interestRate }))} />
        </FormField>
        <FormField label="Mode">
          <TextInput style={styles.input} value={values.interestMode} onChangeText={(value) => onChange((prev) => ({ ...prev, interestMode: value === "compound" ? "compound" : "simple" }))} />
        </FormField>
        <FormField label="Loan date">
          <TextInput style={styles.input} value={values.loanDate} onChangeText={(loanDate) => onChange((prev) => ({ ...prev, loanDate }))} />
        </FormField>
        <FormField label="Due date">
          <TextInput style={styles.input} value={values.dueDate} onChangeText={(dueDate) => onChange((prev) => ({ ...prev, dueDate }))} />
        </FormField>
      </EditorSheet>
    </Modal>
  );
}

export function PaymentEditor({
  visible,
  busy,
  values,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  values: PaymentFormValues;
  onChange: React.Dispatch<React.SetStateAction<PaymentFormValues>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet title="New payment" onClose={onClose} onSave={onSave} busy={busy}>
        <FormField label="Type">
          <TextInput style={styles.input} value={values.paymentType} onChangeText={(value) => onChange((prev) => ({ ...prev, paymentType: value === "principal" ? "principal" : value === "settlement" ? "settlement" : "interest" }))} />
        </FormField>
        <FormField label="Amount">
          <TextInput style={styles.input} keyboardType="numeric" value={values.amount} onChangeText={(amount) => onChange((prev) => ({ ...prev, amount }))} />
        </FormField>
        <FormField label="Payment date">
          <TextInput style={styles.input} value={values.paymentDate} onChangeText={(paymentDate) => onChange((prev) => ({ ...prev, paymentDate }))} />
        </FormField>
      </EditorSheet>
    </Modal>
  );
}

export function DocumentEditor({
  visible,
  busy,
  values,
  onChange,
  onClose,
  onSave,
}: {
  visible: boolean;
  busy: boolean;
  values: DocumentFormValues;
  onChange: React.Dispatch<React.SetStateAction<DocumentFormValues>>;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet title="New document" onClose={onClose} onSave={onSave} busy={busy}>
        <FormField label="Scope">
          <TextInput style={styles.input} value={values.documentScope} onChangeText={(value) => onChange((prev) => ({ ...prev, documentScope: value === "vehicle" ? "vehicle" : "customer" }))} />
        </FormField>
        <FormField label="Document type">
          <TextInput style={styles.input} value={values.documentType} onChangeText={(documentType) => onChange((prev) => ({ ...prev, documentType }))} />
        </FormField>
        <FormField label="Document number">
          <TextInput style={styles.input} value={values.documentNumber} onChangeText={(documentNumber) => onChange((prev) => ({ ...prev, documentNumber }))} />
        </FormField>
        <FormField label="File URI">
          <TextInput style={styles.input} value={values.fileUri} onChangeText={(fileUri) => onChange((prev) => ({ ...prev, fileUri }))} />
        </FormField>
      </EditorSheet>
    </Modal>
  );
}
