import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuoteCard } from "@/components/QuoteCard";
import { Colors } from "@/constants/colors";
import { fetchQuotes } from "@/lib/api";
import { Quote } from "@/types";

type Filter = "all" | "draft" | "sent";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "draft", label: "Borrador" },
  { key: "sent", label: "Enviado" },
];

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const queryClient = useQueryClient();

  const { data: quotes, isLoading, isError, refetch } = useQuery({
    queryKey: ["quotes", filter],
    queryFn: () => fetchQuotes(filter),
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 20 }]}>
        <Text style={styles.headerTitle}>Historial</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/quote/new")}
        >
          <Feather name="plus" size={20} color={Colors.white} />
        </Pressable>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.filterChip, filter === f.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={40} color={Colors.danger} />
          <Text style={styles.emptyTitle}>Error al cargar</Text>
          <Pressable onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          renderItem={({ item }) => (
            <QuoteCard quote={item} onPress={() => router.push(`/quote/${item.id}`)} />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: ["quotes"] })}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="file-text" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin cotizaciones</Text>
              <Text style={styles.emptySubtitle}>
                Toca el botón + para crear tu primera cotización
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  filterActive: { backgroundColor: Colors.primaryLight },
  filterText: { fontSize: 14, color: Colors.textSecondary, fontWeight: "500" },
  filterTextActive: { color: Colors.primary, fontWeight: "700" },
  list: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
  },
  retryText: { color: Colors.primary, fontWeight: "600" },
});
