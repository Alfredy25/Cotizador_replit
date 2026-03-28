import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Quote } from "@/types";
import { formatMXN } from "@/lib/utils";

interface QuoteCardProps {
  quote: Quote;
  onPress: () => void;
}

export function QuoteCard({ quote, onPress }: QuoteCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={styles.folioRow}>
          <Text style={styles.folio}>
            {quote.number ?? "Borrador"}
          </Text>
          <StatusBadge status={quote.status} />
        </View>
        <Feather name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
      <Text style={styles.customer}>
        {quote.customer?.name ?? "Sin cliente"}
      </Text>
      <View style={styles.bottom}>
        <Text style={styles.date}>{quote.issue_date}</Text>
        <Text style={styles.amount}>{formatMXN(quote.total)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  folioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  folio: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  customer: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
});
