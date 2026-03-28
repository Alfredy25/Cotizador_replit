import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { deleteQuote, fetchOrgSettings, fetchQuoteById, finalizeQuote } from "@/lib/api";
import { generateAndSharePDF } from "@/lib/pdf";
import { formatMXN } from "@/lib/utils";

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sharing, setSharing] = useState(false);

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ["quote", id],
    queryFn: () => fetchQuoteById(id),
    enabled: !!id,
  });

  const { data: settings } = useQuery({
    queryKey: ["org-settings"],
    queryFn: fetchOrgSettings,
  });

  const finalizeMutation = useMutation({
    mutationFn: () => finalizeQuote(id),
    onSuccess: (q) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      Alert.alert("Finalizada", `Folio asignado: ${q.number}`);
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const handleShare = async () => {
    if (!quote) return;
    setSharing(true);
    try {
      await generateAndSharePDF(quote, settings ?? null);
    } catch (err: any) {
      Alert.alert("Error al generar PDF", err.message ?? "No se pudo generar el PDF.");
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar cotización",
      "¿Estás seguro? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? 67 : 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !quote) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Feather name="alert-circle" size={40} color={Colors.danger} />
        <Text style={styles.errorText}>No se encontró la cotización</Text>
        <Button title="Volver" onPress={() => router.back()} variant="ghost" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{quote.number ?? "Borrador"}</Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn} disabled={deleteMutation.isPending}>
          <Feather name="trash-2" size={20} color={Colors.white} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status & Date */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <StatusBadge status={quote.status} />
            <Text style={styles.date}>{quote.issue_date}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cliente</Text>
          {quote.customer ? (
            <View>
              <Text style={styles.customerName}>{quote.customer.name}</Text>
              {quote.customer.email && (
                <Text style={styles.customerSub}>{quote.customer.email}</Text>
              )}
              {quote.customer.phone && (
                <Text style={styles.customerSub}>{quote.customer.phone}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.noClient}>Sin cliente asignado</Text>
          )}
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ítems</Text>
          {(quote.items ?? []).length === 0 ? (
            <Text style={styles.noClient}>Sin ítems</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 2 }]}>Descripción</Text>
                <Text style={[styles.tableHeaderText, styles.tableCenter]}>Cant.</Text>
                <Text style={[styles.tableHeaderText, styles.tableRight]}>Total</Text>
              </View>
              {(quote.items ?? []).map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.description}</Text>
                  <Text style={[styles.tableCell, styles.tableCenter]}>{item.qty}</Text>
                  <Text style={[styles.tableCell, styles.tableRight]}>{formatMXN(item.line_total)}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Totals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          <TotalRow label="Subtotal" value={formatMXN(quote.subtotal)} />
          <TotalRow label="IVA" value={formatMXN(quote.tax_total)} />
          <View style={styles.divider} />
          <TotalRow label="Total" value={formatMXN(quote.total)} bold />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actionsBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={sharing ? "Generando PDF..." : "Compartir PDF"}
          onPress={handleShare}
          variant="secondary"
          loading={sharing}
          style={styles.actionBtn}
        />
        {quote.status === "draft" && (
          <Button
            title="Finalizar"
            onPress={() => {
              if (!quote.customer_id) {
                Alert.alert("Cliente requerido", "Asigna un cliente para finalizar.");
                return;
              }
              finalizeMutation.mutate();
            }}
            loading={finalizeMutation.isPending}
            style={styles.actionBtn}
          />
        )}
        {quote.status === "draft" && (
          <Pressable
            onPress={() => router.push(`/quote/edit/${id}`)}
            style={styles.editBtn}
          >
            <Feather name="edit-2" size={20} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function TotalRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, bold && styles.totalBold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.totalBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.white },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  deleteBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 14, color: Colors.textSecondary },
  cardTitle: { fontSize: 13, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  customerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  customerSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  noClient: { fontSize: 14, color: Colors.textMuted, fontStyle: "italic" },
  tableHeader: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 8 },
  tableHeaderText: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableCell: { fontSize: 14, color: Colors.text },
  tableCenter: { textAlign: "center", width: 50 },
  tableRight: { textAlign: "right", width: 90 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { fontSize: 15, color: Colors.textSecondary },
  totalValue: { fontSize: 15, color: Colors.text },
  totalBold: { fontWeight: "800", color: Colors.text, fontSize: 17 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  errorText: { fontSize: 16, color: Colors.danger, fontWeight: "600" },
  actionsBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: "row", gap: 10,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  actionBtn: { flex: 1 },
  editBtn: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
});
