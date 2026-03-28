import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomerCard } from "@/components/CustomerCard";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from "@/lib/api";
import { Customer } from "@/types";

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
}

const emptyForm: CustomerForm = { name: "", email: "", phone: "" };

export default function ClientesScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [nameError, setNameError] = useState("");

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["customers"],
    queryFn: fetchCustomers,
  });

  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setNameError("");
    setModalVisible(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "" });
    setNameError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCustomer(null);
    setForm(emptyForm);
    setNameError("");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setNameError("El nombre es obligatorio");
      return;
    }
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    };
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const topPad = 0;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <Pressable style={styles.addBtn} onPress={openCreate}>
          <Feather name="plus" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <CustomerCard
              customer={item}
              onEdit={() => openEdit(item)}
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin clientes</Text>
              <Text style={styles.emptySubtitle}>Toca + para agregar tu primer cliente</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Customer Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeModal}>
        <View style={[styles.modalContainer, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </Text>
            <Pressable onPress={closeModal}>
              <Feather name="x" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Nombre completo o empresa"
                placeholderTextColor={Colors.textMuted}
                value={form.name}
                onChangeText={(v) => { setForm({ ...form, name: v }); setNameError(""); }}
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Correo (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Teléfono (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="+52 55 1234 5678"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(v) => setForm({ ...form, phone: v })}
              />
            </View>
            <Button title="Guardar" onPress={handleSave} loading={isSaving} style={styles.saveBtn} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", paddingHorizontal: 40 },
  modalContainer: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: Colors.text },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 6 },
  input: {
    height: 52, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, paddingHorizontal: 16, fontSize: 16, color: Colors.text,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  saveBtn: { marginTop: 8 },
});
