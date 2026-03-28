import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import {
  createDraftQuote,
  fetchCustomers,
  fetchOrgSettings,
  finalizeQuote,
} from "@/lib/api";
import { calcQuoteTotals, formatMXN, generateLocalId } from "@/lib/utils";
import { Customer, LocalQuoteItem } from "@/types";

export default function NewQuoteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [items, setItems] = useState<LocalQuoteItem[]>([]);
  const [search, setSearch] = useState("");

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const { data: settings } = useQuery({ queryKey: ["org-settings"], queryFn: fetchOrgSettings });

  const defaultTaxRate = settings?.default_tax ?? 0.16;

  const addItem = () => {
    setItems([
      ...items,
      { id: generateLocalId(), description: "", qty: "1", unit_price: "", tax_rate: defaultTaxRate },
    ]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LocalQuoteItem, value: string | number) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const validItems = items.filter(
    (i) => i.description.trim() && !isNaN(Number(i.qty)) && !isNaN(Number(i.unit_price))
  );

  const parsedItems = validItems.map((i) => ({
    description: i.description.trim(),
    qty: Number(i.qty),
    unit_price: Number(i.unit_price),
    tax_rate: i.tax_rate,
    line_total: Number(i.qty) * Number(i.unit_price) * (1 + i.tax_rate),
  }));

  const totals = calcQuoteTotals(parsedItems);

  const draftMutation = useMutation({
    mutationFn: () =>
      createDraftQuote(selectedCustomer?.id, parsedItems, totals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      Alert.alert("Borrador guardado", "Tu cotización fue guardada como borrador.");
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const quote = await createDraftQuote(selectedCustomer?.id, parsedItems, totals);
      return finalizeQuote(quote.id);
    },
    onSuccess: (quote) => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      Alert.alert("Cotización finalizada", `Folio: ${quote.number}`);
      router.replace(`/quote/${quote.id}`);
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const handleSaveDraft = () => {
    draftMutation.mutate();
  };

  const handleFinalize = () => {
    if (!selectedCustomer) {
      Alert.alert("Cliente requerido", "Selecciona un cliente para finalizar la cotización.");
      return;
    }
    if (parsedItems.length === 0) {
      Alert.alert("Ítems requeridos", "Agrega al menos un ítem válido para finalizar.");
      return;
    }
    finalizeMutation.mutate();
  };

  const filteredCustomers = (customers ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isBusy = draftMutation.isPending || finalizeMutation.isPending;
  const topPad = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Nueva Cotización</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Pressable
            style={styles.customerPicker}
            onPress={() => setShowCustomerPicker(true)}
          >
            <Feather name="user" size={18} color={selectedCustomer ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.customerPickerText, selectedCustomer && styles.customerSelected]}>
              {selectedCustomer?.name ?? "Seleccionar cliente (opcional en borrador)"}
            </Text>
            <Feather name="chevron-down" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ítems</Text>
            <Pressable onPress={addItem} style={styles.addItemBtn}>
              <Feather name="plus" size={16} color={Colors.primary} />
              <Text style={styles.addItemText}>Agregar ítem</Text>
            </Pressable>
          </View>

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Feather name="package" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyItemsText}>No hay ítems. Toca "Agregar ítem"</Text>
            </View>
          )}

          {items.map((item, idx) => (
            <ItemRow
              key={item.id}
              item={item}
              index={idx}
              defaultTaxRate={defaultTaxRate}
              onChange={updateItem}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>

        {/* Summary */}
        {items.length > 0 && (
          <View style={styles.summaryCard}>
            <SummaryRow label="Subtotal" value={formatMXN(totals.subtotal)} />
            <SummaryRow label={`IVA (${Math.round(defaultTaxRate * 100)}%)`} value={formatMXN(totals.tax_total)} />
            <View style={styles.divider} />
            <SummaryRow label="Total" value={formatMXN(totals.total)} bold />
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actionsBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Guardar Borrador"
          onPress={handleSaveDraft}
          variant="secondary"
          loading={draftMutation.isPending}
          disabled={isBusy}
          style={styles.actionBtn}
        />
        <Button
          title="Finalizar"
          onPress={handleFinalize}
          loading={finalizeMutation.isPending}
          disabled={isBusy}
          style={styles.actionBtn}
        />
      </View>

      {/* Customer Picker Modal */}
      <Modal visible={showCustomerPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCustomerPicker(false)}>
        <View style={[styles.modalContainer, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
            <Pressable onPress={() => setShowCustomerPicker(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar cliente..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {selectedCustomer && (
            <Pressable
              style={styles.clearCustomer}
              onPress={() => { setSelectedCustomer(null); setShowCustomerPicker(false); }}
            >
              <Feather name="x-circle" size={16} color={Colors.danger} />
              <Text style={styles.clearCustomerText}>Sin cliente</Text>
            </Pressable>
          )}
          <FlatList
            data={filteredCustomers}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.customerRow, selectedCustomer?.id === item.id && styles.customerRowSelected]}
                onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); setSearch(""); }}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.customerRowName}>{item.name}</Text>
                  {item.email && <Text style={styles.customerRowSub}>{item.email}</Text>}
                </View>
                {selectedCustomer?.id === item.id && (
                  <Feather name="check" size={18} color={Colors.primary} style={{ marginLeft: "auto" }} />
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.noCustomers}>Sin clientes. Crea uno en la pestaña Clientes.</Text>
            }
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

function ItemRow({
  item,
  index,
  defaultTaxRate,
  onChange,
  onRemove,
}: {
  item: LocalQuoteItem;
  index: number;
  defaultTaxRate: number;
  onChange: (id: string, field: keyof LocalQuoteItem, value: string | number) => void;
  onRemove: () => void;
}) {
  const qty = Number(item.qty) || 0;
  const price = Number(item.unit_price) || 0;
  const lineTotal = qty * price * (1 + item.tax_rate);

  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.cardHeader}>
        <Text style={itemStyles.cardNum}>Ítem {index + 1}</Text>
        <Pressable onPress={onRemove}>
          <Feather name="trash-2" size={16} color={Colors.danger} />
        </Pressable>
      </View>
      <TextInput
        style={itemStyles.input}
        placeholder="Descripción del producto o servicio"
        placeholderTextColor={Colors.textMuted}
        value={item.description}
        onChangeText={(v) => onChange(item.id, "description", v)}
      />
      <View style={itemStyles.row}>
        <View style={itemStyles.half}>
          <Text style={itemStyles.fieldLabel}>Cantidad</Text>
          <TextInput
            style={itemStyles.input}
            placeholder="1"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={item.qty}
            onChangeText={(v) => onChange(item.id, "qty", v)}
          />
        </View>
        <View style={itemStyles.half}>
          <Text style={itemStyles.fieldLabel}>Precio unitario</Text>
          <TextInput
            style={itemStyles.input}
            placeholder="0.00"
            placeholderTextColor={Colors.textMuted}
            keyboardType="decimal-pad"
            value={item.unit_price}
            onChangeText={(v) => onChange(item.id, "unit_price", v)}
          />
        </View>
      </View>
      <Text style={itemStyles.lineTotal}>Total línea: {formatMXN(lineTotal)}</Text>
    </View>
  );
}

function SummaryRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && styles.summaryBold]}>{value}</Text>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardNum: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  input: {
    height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, paddingHorizontal: 12, fontSize: 15,
    color: Colors.text, marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500", marginBottom: 4 },
  lineTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.white },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16 },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 },
  customerPicker: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  customerPickerText: { flex: 1, fontSize: 15, color: Colors.textMuted },
  customerSelected: { color: Colors.text, fontWeight: "600" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addItemText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  emptyItems: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyItemsText: { fontSize: 14, color: Colors.textMuted },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: Colors.textSecondary },
  summaryValue: { fontSize: 15, color: Colors.text },
  summaryBold: { fontWeight: "800", color: Colors.text, fontSize: 17 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  actionsBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12,
    flexDirection: "row", gap: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  actionBtn: { flex: 1 },
  modalContainer: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  searchInput: {
    height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, paddingHorizontal: 16, fontSize: 15,
    color: Colors.text, marginBottom: 10,
  },
  clearCustomer: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  clearCustomerText: { fontSize: 14, color: Colors.danger, fontWeight: "500" },
  customerRow: {
    flexDirection: "row", alignItems: "center", padding: 12,
    borderRadius: 12, marginBottom: 6, backgroundColor: Colors.surface, gap: 12,
  },
  customerRowSelected: { backgroundColor: Colors.primaryLight },
  customerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  customerAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  customerRowName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  customerRowSub: { fontSize: 13, color: Colors.textSecondary },
  noCustomers: { fontSize: 14, color: Colors.textMuted, textAlign: "center", paddingTop: 40 },
});
