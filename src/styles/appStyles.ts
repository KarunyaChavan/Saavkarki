import { StyleSheet, Platform } from "react-native";

export const THEME = {
  colors: {
    primary: "#0f766e", // Teal 700
    primaryLight: "#f0fdfa", // Teal 50
    primaryMedium: "#ccfbf1", // Teal 100
    primaryDark: "#115e59", // Teal 800
    textDark: "#0f172a", // Slate 900
    textMedium: "#475569", // Slate 600
    textLight: "#64748b", // Slate 500
    background: "#f8fafc", // Slate 50
    surface: "#ffffff", // White
    border: "#e2e8f0", // Slate 200
    borderDark: "#cbd5e1", // Slate 300
    success: "#16a34a", // Green 600
    successBg: "#dcfce7", // Green 100
    warning: "#d97706", // Amber 600
    warningBg: "#fef3c7", // Amber 100
    danger: "#dc2626", // Red 600
    dangerBg: "#fee2e2", // Red 100
    divider: "#f1f5f9", // Slate 100
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 999,
  },
  shadows: {
    sm: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 6,
    },
  },
};

export const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    gap: THEME.spacing.md,
  },
  loadingText: {
    color: THEME.colors.textMedium,
    fontSize: 16,
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    paddingTop: Platform.select({ android: 40, ios: 56, default: 16 }),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.primaryDark,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: THEME.colors.primaryMedium,
    marginTop: 1,
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    ...THEME.shadows.sm,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    ...THEME.shadows.sm,
  },
  secondaryButtonText: {
    color: THEME.colors.textDark,
    fontWeight: "600",
    fontSize: 13,
  },
  // Button style for buttons that sit ON the teal primary header background
  headerButton: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
  },
  headerButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
  },
  tabs: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.divider,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabActive: {
    backgroundColor: THEME.colors.primaryLight,
    borderColor: THEME.colors.primaryMedium,
  },
  tabText: {
    fontSize: 12,
    color: THEME.colors.textMedium,
    fontWeight: "600",
  },
  tabTextActive: {
    color: THEME.colors.primary,
  },
  scroll: {
    paddingTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: 108,
  },
  section: {
    marginBottom: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    ...THEME.shadows.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    color: THEME.colors.textDark,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  sectionBody: {
    gap: THEME.spacing.md,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  statCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    ...THEME.shadows.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.primary,
  },
  statLabel: {
    color: THEME.colors.textLight,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    color: THEME.colors.textDark,
    fontSize: 20,
    fontWeight: "800",
    marginTop: THEME.spacing.sm,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.divider,
  },
  rowTitle: {
    fontSize: 15,
    color: THEME.colors.textDark,
    fontWeight: "600",
  },
  rowSub: {
    fontSize: 12,
    color: THEME.colors.textLight,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 14,
    color: THEME.colors.textDark,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 18,
    color: THEME.colors.textLight,
    fontWeight: "600",
  },
  risk: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    overflow: "hidden",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  risk_green: {
    color: THEME.colors.success,
    backgroundColor: THEME.colors.successBg,
  },
  risk_yellow: {
    color: THEME.colors.warning,
    backgroundColor: THEME.colors.warningBg,
  },
  risk_red: {
    color: THEME.colors.danger,
    backgroundColor: THEME.colors.dangerBg,
  },
  bodyText: {
    color: THEME.colors.textMedium,
    fontSize: 14,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.borderDark,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.textDark,
    fontSize: 14,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  formField: {
    marginBottom: THEME.spacing.lg,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textMedium,
    marginBottom: THEME.spacing.xs,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: THEME.colors.background,
    borderTopLeftRadius: THEME.borderRadius.lg,
    borderTopRightRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
    ...THEME.shadows.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.divider,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    paddingTop: Platform.select({ android: 40, ios: 56, default: 16 }),
    paddingHorizontal: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.primaryDark,
    marginHorizontal: -THEME.spacing.lg,
    marginTop: -THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  detailActions: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
  },
  detailSub: {
    fontSize: 13,
    color: THEME.colors.primaryMedium,
    marginTop: 1,
  },
  detailCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    ...THEME.shadows.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  detailCardTitle: {
    fontSize: 16,
    color: THEME.colors.textDark,
    fontWeight: "700",
    marginBottom: THEME.spacing.md,
    letterSpacing: -0.3,
  },
  groupBlock: {
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  groupTitle: {
    fontSize: 13,
    color: THEME.colors.textMedium,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bottomBar: {
    position: "absolute",
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    bottom: THEME.spacing.lg,
    flexDirection: "row",
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.textDark,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.sm,
    ...THEME.shadows.md,
  },
  bottomAction: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: "#1e293b",
    alignItems: "center",
  },
  bottomActionText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 11,
    textAlign: "center",
  },
  bottomActionActive: {
    backgroundColor: THEME.colors.primary,
  },

  // Newly Added Styles for Enhanced UX
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryMedium,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: THEME.colors.primaryDark,
    fontWeight: "700",
    fontSize: 16,
  },
  filePickButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primaryLight,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.xs,
  },
  filePickButtonText: {
    color: THEME.colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  fileInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.divider,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: THEME.spacing.sm,
  },
  fileInfoText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.textDark,
    fontWeight: "500",
  },
  fileRemoveText: {
    color: THEME.colors.danger,
    fontWeight: "700",
    fontSize: 13,
  },
  docGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME.spacing.md,
  },
  docCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    ...THEME.shadows.sm,
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  docIconText: {
    fontSize: 32,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.textDark,
    textAlign: "center",
  },
  docSub: {
    fontSize: 11,
    color: THEME.colors.textLight,
    textAlign: "center",
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.divider,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.lg,
  },
  viewerContainer: {
    width: "100%",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.md,
    alignItems: "center",
  },
  viewerImage: {
    width: "100%",
    height: 300,
    borderRadius: THEME.borderRadius.md,
    resizeMode: "contain",
  },
  viewerPdfPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: THEME.colors.divider,
    borderRadius: THEME.borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    gap: THEME.spacing.md,
  },
  viewerPdfIcon: {
    fontSize: 64,
  },
  viewerPdfText: {
    color: THEME.colors.textDark,
    fontWeight: "700",
    fontSize: 16,
  },
  viewerMeta: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: THEME.colors.divider,
    paddingTop: THEME.spacing.md,
    gap: 6,
  },
  viewerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  viewerMetaLabel: {
    color: THEME.colors.textMedium,
    fontSize: 13,
    fontWeight: "600",
  },
  viewerMetaValue: {
    color: THEME.colors.textDark,
    fontSize: 13,
    fontWeight: "700",
  },
});
