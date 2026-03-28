import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/colors";
import { QuoteStatus } from "@/types";

interface StatusBadgeProps {
  status: QuoteStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const isDraft = status === "draft";
  return (
    <View style={[styles.badge, isDraft ? styles.draft : styles.sent]}>
      <Text style={[styles.text, isDraft ? styles.draftText : styles.sentText]}>
        {isDraft ? "Borrador" : "Enviado"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  draft: {
    backgroundColor: Colors.warningLight,
  },
  sent: {
    backgroundColor: Colors.successLight,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  draftText: {
    color: "#92400E",
  },
  sentText: {
    color: "#065F46",
  },
});
