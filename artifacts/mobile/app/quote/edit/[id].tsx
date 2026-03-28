import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { fetchCustomers, fetchOrgSettings, fetchQuoteById, updateQuote } from "@/lib/api";
import { calcQuoteTotals, formatMXN, generateLocalId } from "@/lib/utils";
import { Customer, LocalQuoteItem } from "@/types";

export default function EditQuoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [items, setItems] = useState<LocalQuoteItem[]>([]);
  const [search, setSearch] = useState("");

  const { data: quote, isLoading: loadingQuote } = useQuery({
    queryKey: ["quote", id],
    queryFn: () => fetchQuoteById(id),
    enabled: !!id,
  });

  const { data: customers } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers });
  const { data: settings } = useQuery({ queryKey: ["org-settings"], queryFn: fetchOrgSettings });

  const defaultTaxRate = settings?.default_tax ?? 0.16;

  useEffect(() => {
    if (quote) {
      if (quote.customer) setSelectedCustomer(quote.customer as Customer);
      if (quote.items && quote.items.length > 0) {
        setItems(
          quote.items.map((i) => ({
            id: i.id,
            description: i.description,
            qty: String(i.qty),
            unit_price: String(i.unit_price),
            tax_rate: i.tax_rate,
          }))
        );
      }
    }
  }, [quote]);

  const addItem = () =>
    setItems([...items, { id: generateLocalId(), description: "", qty: "1", unit_price: "", tax_rate: defaultTaxRate }]);

  const removeItem = (itemId: string) => setItems(items.filter((i) => i.id !== itemId));

  const updateItem = (itemId: string, field: keyof LocalQuoteItem, value: string | number) =>
    setItems(items.map((i) => (i.id === itemId ? { ...i, [field]: value } : i)));

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

  const saveMutation = useMutation({
    mutationFn: () => updateQuote(id, selectedCustomer?.id, parsedItems, totals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["quote", id] });
      Alert.alert("Guardado", "Cotización actualizada correctamente.");
      router.back();
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const filteredCustomers = (customers ?? []).filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const topPad = Platform.OS === "web" ? 67 : 0;

  if (loadingQuote) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Cotización</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <Pressable style={styles.customerPicker} onPress={() => setShowCustomerPicker(true)}>
            <Feather name="user" size={18} color={selectedCustomer ? Colors.primary : Colors.textMuted} />
            <Text style={[styles.customerPickerText, selectedCustomer && styles.customerSelected]}>
              {selectedCustomer?.name ?? "Seleccionar cliente"}
            </Text>
            <Feather name="chevron-down" size={18} color={Colors.textMuted} />
          </Pressable>
        </View>

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
              <Text style={styles.emptyItemsText}>Sin ítems. Toca "Agregar ítem"</Text>
            </View>
          )}
          {items.map((item, idx) => (
            <ItemRow
              key={item.id}
              item={item}
              index={idx}
              onChange={updateItem}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </View>

        {items.length > 0 && (
          <View style={styles.summaryCard}>
            <SummaryRow label="Subtotal" value={formatMXN(totals.subtotal)} />
            <SummaryRow label={`IVA (${Math.round(defaultTaxRate * 100)}%)`} value={formatMXN(totals.tax_total)} />
            <View style={styles.divider} />
            <SummaryRow label="Total" value={formatMXN(totals.total)} bold />
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionsBar, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Guardar cambios"
          onPress={() => saveMutation.mutate()}
          loading={saveMutation.isPending}
          style={{ flex: 1 }}
        />
      </View>

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
          <FlatList
            data={filteredCustomers}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.customerRow, selectedCustomer?.id === item.id && styles.customerRowSelected]}
                onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); setSearch(""); }}
              >
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>
    </View>
  );
}

function ItemRow({
  item, index, onChange, onRemove,
}: {
  item: LocalQuoteItem; index: number;
  onChange: (id: string, field: keyof LocalQuoteItem, value: string | number) => void;
  onRemove: () => void;
}) {
  const lineTotal = (Number(item.qty) || 0) * (Number(item.unit_price) || 0) * (1 + item.tax_rate);
  return (
    <View style={itemStyles.card}>
      <View style={itemStyles.cardHeader}>
        <Text style={itemStyles.cardNum}>Ítem {index + 1}</Text>
        <Pressable onPress={onRemove}><Feather name="trash-2" size={16} color={Colors.danger} /></Pressable>
      </View>
      <TextInput style={itemStyles.input} placeholder="Descripción" placeholderTextColor={Colors.textMuted} value={item.description} onChangeText={(v) => onChange(item.id, "description", v)} />
      <View style={itemStyles.row}>
        <View style={itemStyles.half}>
          <Text style={itemStyles.fieldLabel}>Cantidad</Text>
          <TextInput style={itemStyles.input} placeholder="1" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={item.qty} onChangeText={(v) => onChange(item.id, "qty", v)} />
        </View>
        <View style={itemStyles.half}>
          <Text style={itemStyles.fieldLabel}>Precio unitario</Text>
          <TextInput style={itemStyles.input} placeholder="0.00" placeholderTextColor={Colors.textMuted} keyboardType="decimal-pad" value={item.unit_price} onChangeText={(v) => onChange(item.id, "unit_price", v)} />
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
  card: { backgroundColor: Colors.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  cardNum: { fontSize: 13, fontWeight: "600", color: Colors.primary },
  input: { height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 12, fontSize: 15, color: Colors.text, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500", marginBottom: 4 },
  lineTotal: { fontSize: 13, fontWeight: "700", color: Colors.primary, textAlign: "right" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.white },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 16 },
  section: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8 },
  customerPicker: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  customerPickerText: { flex: 1, fontSize: 15, color: Colors.textMuted },
  customerSelected: { color: Colors.text, fontWeight: "600" },
  addItemBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addItemText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  emptyItems: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyItemsText: { fontSize: 14, color: Colors.textMuted },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 15, color: Colors.textSecondary },
  summaryValue: { fontSize: 15, color: Colors.text },
  summaryBold: { fontWeight: "800", color: Colors.text, fontSize: 17 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },
  actionsBar: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: Colors.surface, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8 },
  modalContainer: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  searchInput: { height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, paddingHorizontal: 16, fontSize: 15, color: Colors.text, marginBottom: 10 },
  customerRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 6, backgroundColor: Colors.surface, gap: 12 },
  customerRowSelected: { backgroundColor: Colors.primaryLight },
  customerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" },
  customerAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  customerRowName: { fontSize: 15, fontWeight: "600", color: Colors.text },
  customerRowSub: { fontSize: 13, color: Colors.textSecondary },
});
