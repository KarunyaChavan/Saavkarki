import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";

import { styles, THEME } from "../../styles/appStyles";
import {
  Customer,
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
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {children}
        </ScrollView>
        <Pressable
          style={styles.primaryButton}
          onPress={onSave}
          disabled={busy}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

export interface DropdownOption<T> {
  label: string;
  value: T;
}

export function DropdownPicker<T>({
  options,
  selectedValue,
  onSelect,
  placeholder = "Select an option...",
  searchable = false,
  searchPlaceholder = "Search...",
}: {
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const filteredOptions = React.useMemo(() => {
    if (!searchable || !searchQuery) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  return (
    <View>
      <Pressable
        style={[
          styles.input,
          {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: THEME.colors.surface,
          },
        ]}
        onPress={() => {
          setSearchQuery("");
          setModalVisible(true);
        }}
      >
        <Text
          style={{
            color: selectedOption
              ? THEME.colors.textDark
              : THEME.colors.textLight,
            fontSize: 14,
            fontWeight: selectedOption ? "600" : "400",
          }}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={{ fontSize: 12, color: THEME.colors.textLight }}>▼</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { maxHeight: "75%", paddingBottom: 20 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sectionTitle}>Select</Text>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.secondaryButtonText}>Close</Text>
              </Pressable>
            </View>

            {searchable && (
              <TextInput
                style={[styles.input, { marginVertical: 8 }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={THEME.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            )}

            <ScrollView style={{ flex: 1, marginTop: 8 }}>
              {filteredOptions.length === 0 ? (
                <Text
                  style={[
                    styles.bodyText,
                    { textAlign: "center", marginVertical: 20 },
                  ]}
                >
                  No options found.
                </Text>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === selectedValue;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      style={[
                        styles.listRow,
                        { marginVertical: 4 },
                        isSelected && {
                          backgroundColor: THEME.colors.primaryLight,
                          borderColor: THEME.colors.primaryMedium,
                        },
                      ]}
                      onPress={() => {
                        onSelect(opt.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.rowTitle,
                          { flex: 1 },
                          isSelected && {
                            color: THEME.colors.primary,
                            fontWeight: "700",
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Text
                          style={{ fontSize: 16, color: THEME.colors.primary }}
                        >
                          ✓
                        </Text>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  const [newDoc, setNewDoc] = React.useState<{
    fileUri: string;
    documentType: string;
    documentNumber: string;
  } | null>(null);

  const handlePickTempDoc = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setNewDoc({
          fileUri: asset.uri,
          documentType: "Aadhaar",
          documentNumber: "",
        });
      }
    } catch (err) {
      console.warn("Error picking document: ", err);
    }
  };

  const confirmAddDoc = () => {
    if (!newDoc) return;
    const documentType = newDoc.documentType.trim();
    if (!documentType) {
      alert("Please specify document type");
      return;
    }

    const docToAdd = {
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      documentScope: "customer" as const,
      documentType,
      documentNumber: newDoc.documentNumber.trim(),
      fileUri: newDoc.fileUri,
      uploadDate: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      notes: `Attached during customer setup`,
    };

    onChange((prev) => ({
      ...prev,
      tempDocuments: [...(prev.tempDocuments || []), docToAdd],
    }));

    setNewDoc(null);
  };

  const removeTempDoc = (id: string) => {
    onChange((prev) => ({
      ...prev,
      tempDocuments: (prev.tempDocuments || []).filter((d) => d.id !== id),
    }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet
        title={isEditing ? "Edit customer" : "New customer"}
        onClose={onClose}
        onSave={onSave}
        busy={busy}
      >
        <FormField label="Full name">
          <TextInput
            style={styles.input}
            value={values.fullName}
            onChangeText={(fullName) =>
              onChange((prev) => ({ ...prev, fullName }))
            }
          />
        </FormField>
        <FormField label="Mobile number">
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={values.mobileNumber}
            onChangeText={(mobileNumber) =>
              onChange((prev) => ({ ...prev, mobileNumber }))
            }
          />
        </FormField>
        <FormField label="Alternate mobile">
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={values.alternateMobileNumber}
            onChangeText={(alternateMobileNumber) =>
              onChange((prev) => ({ ...prev, alternateMobileNumber }))
            }
          />
        </FormField>
        <FormField label="Address">
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={values.address}
            onChangeText={(address) =>
              onChange((prev) => ({ ...prev, address }))
            }
          />
        </FormField>
        <FormField label="Notes">
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            value={values.notes}
            onChangeText={(notes) => onChange((prev) => ({ ...prev, notes }))}
          />
        </FormField>

        {/* Temporary Document Uploads inside Customer Setup */}
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            paddingTop: 16,
            marginTop: 12,
          }}
        >
          <Text
            style={[styles.sectionTitle, { fontSize: 16, marginBottom: 12 }]}
          >
            Identity Documents
          </Text>

          {values.tempDocuments &&
            values.tempDocuments.map((doc) => (
              <View
                key={doc.id}
                style={[styles.fileInfoCard, { marginBottom: 8 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{doc.documentType}</Text>
                  <Text style={styles.rowSub}>
                    Number: {doc.documentNumber || "N/A"}
                  </Text>
                </View>
                <Pressable onPress={() => removeTempDoc(doc.id)}>
                  <Text style={styles.fileRemoveText}>Remove</Text>
                </Pressable>
              </View>
            ))}

          {newDoc ? (
            <View
              style={{
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 8,
                padding: 12,
                gap: 10,
              }}
            >
              <Text style={styles.rowSub} numberOfLines={1}>
                File:{" "}
                {newDoc.fileUri.substring(newDoc.fileUri.lastIndexOf("/") + 1)}
              </Text>
              <FormField label="Doc Type">
                <View
                  style={{
                    flexDirection: "row",
                    gap: 6,
                    flexWrap: "wrap",
                    marginVertical: 4,
                  }}
                >
                  {[
                    "Aadhaar",
                    "PAN",
                    "Passport",
                    "Driving License",
                    "Other",
                  ].map((t) => (
                    <Pressable
                      key={t}
                      style={[
                        styles.tab,
                        newDoc.documentType === t && styles.tabActive,
                        { paddingVertical: 6, flex: 0, paddingHorizontal: 12 },
                      ]}
                      onPress={() =>
                        setNewDoc((prev) =>
                          prev ? { ...prev, documentType: t } : null,
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.tabText,
                          newDoc.documentType === t && styles.tabTextActive,
                          { fontSize: 11 },
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </FormField>
              <FormField label="Document Number">
                <TextInput
                  style={[styles.input, { paddingVertical: 8 }]}
                  placeholder="Enter Card/Doc ID"
                  value={newDoc.documentNumber}
                  onChangeText={(num) =>
                    setNewDoc((prev) =>
                      prev ? { ...prev, documentNumber: num } : null,
                    )
                  }
                />
              </FormField>
              <View
                style={{
                  flexDirection: "row",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 4,
                }}
              >
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => setNewDoc(null)}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={confirmAddDoc}>
                  <Text style={styles.primaryButtonText}>Add to Profile</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.filePickButton}
              onPress={handlePickTempDoc}
            >
              <Text style={styles.docIconText}>📁</Text>
              <Text style={styles.filePickButtonText}>
                + Add Identity Document
              </Text>
            </Pressable>
          )}
        </View>
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
  const collateralTypes = [
    "Bike",
    "Car",
    "Smartphone",
    "Television",
    "Gold",
    "Other",
  ] as const;
  const isVehicle =
    values.vehicleType === "Bike" || values.vehicleType === "Car";

  const handlePickCollateralPhoto = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg"],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        onChange((prev) => ({
          ...prev,
          photoUrisJson: JSON.stringify([asset.uri]),
        }));
      }
    } catch (err) {
      console.warn("Error picking collateral photo: ", err);
    }
  };

  const getUploadedPhotoUri = () => {
    try {
      const uris = JSON.parse(values.photoUrisJson || "[]");
      return uris[0] || "";
    } catch {
      return "";
    }
  };

  const photoUri = getUploadedPhotoUri();

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet
        title="New collateral"
        onClose={onClose}
        onSave={onSave}
        busy={busy}
      >
        <FormField label="Collateral type">
          <DropdownPicker
            options={collateralTypes.map((type) => ({
              label: type,
              value: type,
            }))}
            selectedValue={values.vehicleType}
            onSelect={(type) =>
              onChange((prev) => ({
                ...prev,
                vehicleType: type,
                registrationNumber:
                  type === "Bike" || type === "Car"
                    ? prev.registrationNumber
                    : "N/A",
                year:
                  type === "Bike" || type === "Car"
                    ? prev.year
                    : new Date().getFullYear().toString(),
              }))
            }
            placeholder="Select collateral type"
          />
        </FormField>

        {isVehicle ? (
          <>
            <FormField label="Registration number">
              <TextInput
                style={styles.input}
                value={
                  values.registrationNumber === "N/A"
                    ? ""
                    : values.registrationNumber
                }
                onChangeText={(registrationNumber) =>
                  onChange((prev) => ({ ...prev, registrationNumber }))
                }
              />
            </FormField>
            <FormField label="Make / Brand">
              <TextInput
                style={styles.input}
                placeholder="e.g. Hero, Hyundai"
                value={values.make}
                onChangeText={(make) => onChange((prev) => ({ ...prev, make }))}
              />
            </FormField>
            <FormField label="Model / Desc">
              <TextInput
                style={styles.input}
                placeholder="e.g. Splendor, i20"
                value={values.model}
                onChangeText={(model) =>
                  onChange((prev) => ({ ...prev, model }))
                }
              />
            </FormField>
            <FormField label="Year">
              <TextInput
                style={styles.input}
                value={values.year}
                onChangeText={(year) => onChange((prev) => ({ ...prev, year }))}
              />
            </FormField>
            <FormField label="Color">
              <TextInput
                style={styles.input}
                value={values.color}
                onChangeText={(color) =>
                  onChange((prev) => ({ ...prev, color }))
                }
              />
            </FormField>
            <FormField label="Chassis Number (VIN)">
              <TextInput
                style={styles.input}
                value={values.chassisNumber}
                onChangeText={(chassisNumber) =>
                  onChange((prev) => ({ ...prev, chassisNumber }))
                }
              />
            </FormField>
            <FormField label="Engine Number">
              <TextInput
                style={styles.input}
                value={values.engineNumber}
                onChangeText={(engineNumber) =>
                  onChange((prev) => ({ ...prev, engineNumber }))
                }
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Brand / Manufacturer">
              <TextInput
                style={styles.input}
                placeholder="e.g. Apple, Samsung, 22K Gold"
                value={values.make}
                onChangeText={(make) => onChange((prev) => ({ ...prev, make }))}
              />
            </FormField>
            <FormField label="Description / Model Details">
              <TextInput
                style={styles.input}
                placeholder="e.g. iPhone 15 Pro, Smart TV 55 inch, Chain 12 grams"
                value={values.model}
                onChangeText={(model) =>
                  onChange((prev) => ({ ...prev, model }))
                }
              />
            </FormField>
            <FormField label="Serial Number / Identifier">
              <TextInput
                style={styles.input}
                placeholder="e.g. IMEI, Serial, unique identifier"
                value={values.chassisNumber}
                onChangeText={(chassisNumber) =>
                  onChange((prev) => ({ ...prev, chassisNumber }))
                }
              />
            </FormField>
            <FormField label="Notes / Value Details">
              <TextInput
                style={styles.input}
                placeholder="e.g. Estimated value Rs. 45,000"
                value={values.color}
                onChangeText={(color) =>
                  onChange((prev) => ({ ...prev, color }))
                }
              />
            </FormField>
          </>
        )}

        <FormField label="Collateral Photo (Evidence)">
          {photoUri ? (
            <View style={{ gap: 8, alignItems: "center" }}>
              <Image
                source={{ uri: photoUri }}
                style={{
                  width: "100%",
                  height: 180,
                  borderRadius: 8,
                  resizeMode: "cover",
                }}
              />
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  onChange((prev) => ({ ...prev, photoUrisJson: "[]" }))
                }
              >
                <Text style={styles.fileRemoveText}>Remove Photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.filePickButton}
              onPress={handlePickCollateralPhoto}
            >
              <Text style={styles.docIconText}>📸</Text>
              <Text style={styles.filePickButtonText}>
                Upload Collateral Photo
              </Text>
            </Pressable>
          )}
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
  customers = [],
  collaterals = [],
}: {
  visible: boolean;
  busy: boolean;
  values: LoanFormValues;
  onChange: React.Dispatch<React.SetStateAction<LoanFormValues>>;
  onClose: () => void;
  onSave: () => void;
  customers?: Customer[];
  collaterals?: Vehicle[];
}) {
  const filteredCollateral = collaterals.filter(
    (c) => c.customerId === values.customerId,
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet
        title="New loan"
        onClose={onClose}
        onSave={onSave}
        busy={busy}
      >
        {/* Customer Dropdown/Selector */}
        <FormField label="Select Customer">
          <DropdownPicker
            options={customers.map((c) => ({
              label: `${c.fullName} (${c.mobileNumber})`,
              value: c.id,
            }))}
            selectedValue={values.customerId}
            onSelect={(id) => {
              const firstColId =
                collaterals.find((v) => v.customerId === id)?.id || "";
              onChange((prev) => ({
                ...prev,
                customerId: id,
                vehicleId: firstColId,
              }));
            }}
            placeholder="Select a customer"
            searchable
            searchPlaceholder="Search by name or phone..."
          />
        </FormField>

        {/* Collateral Dropdown/Selector */}
        <FormField label="Select Collateral">
          {filteredCollateral.length === 0 ? (
            <Text
              style={[
                styles.bodyText,
                { color: "#dc2626", fontStyle: "italic", fontSize: 13 },
              ]}
            >
              No collateral registered for this customer. Please add collateral
              first.
            </Text>
          ) : (
            <DropdownPicker
              options={filteredCollateral.map((col) => {
                const label =
                  col.vehicleType === "Bike" || col.vehicleType === "Car"
                    ? `${col.registrationNumber} (${col.make})`
                    : `${col.vehicleType} - ${col.make} ${col.model}`;
                return { label, value: col.id };
              })}
              selectedValue={values.vehicleId}
              onSelect={(id) =>
                onChange((prev) => ({ ...prev, vehicleId: id }))
              }
              placeholder="Select collateral"
            />
          )}
        </FormField>

        <FormField label="Principal amount">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={values.principalAmount}
            onChangeText={(principalAmount) =>
              onChange((prev) => ({ ...prev, principalAmount }))
            }
          />
        </FormField>
        <FormField label="Interest rate % per month">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={values.interestRate}
            onChangeText={(interestRate) =>
              onChange((prev) => ({ ...prev, interestRate }))
            }
          />
        </FormField>
        <FormField label="Mode">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["simple", "compound"] as const).map((mode) => (
              <Pressable
                key={mode}
                style={[
                  styles.tab,
                  values.interestMode === mode && styles.tabActive,
                  { paddingVertical: 8 },
                ]}
                onPress={() =>
                  onChange((prev) => ({ ...prev, interestMode: mode }))
                }
              >
                <Text
                  style={[
                    styles.tabText,
                    values.interestMode === mode && styles.tabTextActive,
                  ]}
                >
                  {mode === "simple" ? "Simple" : "Compound"}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>
        <FormField label="Loan date">
          <TextInput
            style={styles.input}
            value={values.loanDate}
            onChangeText={(loanDate) =>
              onChange((prev) => ({ ...prev, loanDate }))
            }
          />
        </FormField>
        <FormField label="Due date">
          <TextInput
            style={styles.input}
            value={values.dueDate}
            onChangeText={(dueDate) =>
              onChange((prev) => ({ ...prev, dueDate }))
            }
          />
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
  const paymentTypeOptions = [
    { label: "Interest", value: "interest" as const },
    { label: "Principal", value: "principal" as const },
    { label: "Settlement", value: "settlement" as const },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet
        title="New payment"
        onClose={onClose}
        onSave={onSave}
        busy={busy}
      >
        <FormField label="Type">
          <DropdownPicker
            options={paymentTypeOptions}
            selectedValue={values.paymentType}
            onSelect={(type) =>
              onChange((prev) => ({ ...prev, paymentType: type }))
            }
            placeholder="Select payment type"
          />
        </FormField>
        <FormField label="Amount">
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={values.amount}
            onChangeText={(amount) => onChange((prev) => ({ ...prev, amount }))}
          />
        </FormField>
        <FormField label="Payment date">
          <TextInput
            style={styles.input}
            value={values.paymentDate}
            onChangeText={(paymentDate) =>
              onChange((prev) => ({ ...prev, paymentDate }))
            }
          />
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
  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        onChange((prev) => ({
          ...prev,
          fileUri: asset.uri,
          notes: prev.notes || `Uploaded file: ${asset.name}`,
        }));
      }
    } catch (err) {
      console.warn("Error picking document: ", err);
    }
  };

  const docTypeOptions =
    values.documentScope === "customer"
      ? ["Aadhaar", "PAN", "Passport", "Driving License", "Other"]
      : [
          "RC Book",
          "Insurance",
          "PUC Certificate",
          "Purchase Invoice",
          "Other",
        ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <EditorSheet
        title="New document"
        onClose={onClose}
        onSave={onSave}
        busy={busy}
      >
        <FormField label="Scope">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["customer", "vehicle"] as const).map((scope) => (
              <Pressable
                key={scope}
                style={[
                  styles.tab,
                  values.documentScope === scope && styles.tabActive,
                  { paddingVertical: 8 },
                ]}
                onPress={() =>
                  onChange((prev) => ({
                    ...prev,
                    documentScope: scope,
                    documentType: scope === "customer" ? "Aadhaar" : "RC Book",
                  }))
                }
              >
                <Text
                  style={[
                    styles.tabText,
                    values.documentScope === scope && styles.tabTextActive,
                  ]}
                >
                  {scope === "vehicle" ? "Collateral" : "Customer"}
                </Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        {/* Dynamic scope-wise quick dropdown selection pills */}
        <FormField label="Document type">
          <DropdownPicker
            options={docTypeOptions.map((opt) => ({
              label: opt,
              value: opt,
            }))}
            selectedValue={values.documentType}
            onSelect={(opt) =>
              onChange((prev) => ({ ...prev, documentType: opt }))
            }
            placeholder="Select document type"
          />
          <TextInput
            style={[styles.input, { marginTop: 6 }]}
            placeholder="Or enter custom type"
            value={values.documentType}
            onChangeText={(documentType) =>
              onChange((prev) => ({ ...prev, documentType }))
            }
          />
        </FormField>

        <FormField label="Document number">
          <TextInput
            style={styles.input}
            placeholder="Card number or Reg ID"
            value={values.documentNumber}
            onChangeText={(documentNumber) =>
              onChange((prev) => ({ ...prev, documentNumber }))
            }
          />
        </FormField>

        <FormField label="Document File (PNG or PDF)">
          {values.fileUri ? (
            <View style={styles.fileInfoCard}>
              <Text style={styles.fileInfoText} numberOfLines={1}>
                {values.fileUri.substring(
                  values.fileUri.lastIndexOf("/") + 1,
                ) || "Selected Document"}
              </Text>
              <Pressable
                onPress={() => onChange((prev) => ({ ...prev, fileUri: "" }))}
              >
                <Text style={styles.fileRemoveText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.filePickButton}
              onPress={handlePickDocument}
            >
              <Text style={styles.docIconText}>📁</Text>
              <Text style={styles.filePickButtonText}>
                Select PDF or PNG Document
              </Text>
            </Pressable>
          )}
        </FormField>
      </EditorSheet>
    </Modal>
  );
}
