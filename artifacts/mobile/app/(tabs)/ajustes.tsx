import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useAuth } from "@/context/AuthContext";
import { fetchOrgSettings, upsertOrgSettings } from "@/lib/api";
import { supabase } from "@/lib/supabase";

const TAX_OPTIONS = ["0", "8", "10", "16"];

export default function AjustesScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();

  const [businessName, setBusinessName] = useState("");
  const [folioPrefix, setFolioPrefix] = useState("COT");
  const [defaultTax, setDefaultTax] = useState("16");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["org-settings"],
    queryFn: fetchOrgSettings,
  });

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.business_name ?? "");
      setFolioPrefix(settings.folio_prefix ?? "COT");
      // Convert decimal (e.g. 0.16) to whole number string (e.g. "16")
      const taxPercent = Math.round((settings.default_tax ?? 0.16) * 100);
      setDefaultTax(String(taxPercent));
      setLogoUrl(settings.logo_url);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: upsertOrgSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-settings"] });
      Alert.alert("Guardado", "Tus ajustes han sido guardados.");
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  const handleSave = () => {
    const taxNum = parseFloat(defaultTax);
    saveMutation.mutate({
      business_name: businessName.trim(),
      folio_prefix: folioPrefix.trim() || "COT",
      default_tax: taxNum / 100,
      logo_url: logoUrl,
    });
  };

  const pickLogo = async () => {
    if (Platform.OS === "web") {
      Alert.alert("No disponible", "La subida de logo no está disponible en web.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para subir el logo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const fileName = `logo-${user!.id}-${Date.now()}.${ext}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from("logos")
        .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName);
      setLogoUrl(publicUrl);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo subir el logo.");
    } finally {
      setUploading(false);
    }
  };

  const topPad = 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logo del negocio</Text>
          <Pressable onPress={pickLogo} style={styles.logoContainer} disabled={uploading}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                {uploading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Feather name="image" size={28} color={Colors.textMuted} />
                    <Text style={styles.logoPlaceholderText}>Toca para subir logo</Text>
                  </>
                )}
              </View>
            )}
            {logoUrl && !uploading && (
              <View style={styles.editBadge}>
                <Feather name="edit-2" size={12} color={Colors.white} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Business Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del negocio</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre del negocio</Text>
            <TextInput
              style={styles.input}
              placeholder="Mi Empresa S.A. de C.V."
              placeholderTextColor={Colors.textMuted}
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Prefijo de folio</Text>
            <TextInput
              style={styles.input}
              placeholder="COT"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              value={folioPrefix}
              onChangeText={setFolioPrefix}
            />
            <Text style={styles.hint}>Ej: COT → COT-000001</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>IVA por defecto</Text>
            <View style={styles.taxOptions}>
              {TAX_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.taxChip,
                    defaultTax === option && styles.taxChipActive,
                  ]}
                  onPress={() => setDefaultTax(option)}
                >
                  <Text
                    style={[
                      styles.taxChipText,
                      defaultTax === option && styles.taxChipTextActive,
                    ]}
                  >
                    {option}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Button
          title="Guardar cambios"
          onPress={handleSave}
          loading={saveMutation.isPending}
          style={styles.saveBtn}
        />

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.accountRow}>
            <Feather name="mail" size={16} color={Colors.textSecondary} />
            <Text style={styles.accountEmail}>{user?.email}</Text>
          </View>
          <Button
            title="Cerrar sesión"
            onPress={signOut}
            variant="danger"
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20, paddingBottom: 12, backgroundColor: Colors.primary,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: Colors.white },
  scroll: { padding: 16 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: Colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16 },
  logoContainer: { alignSelf: "center", position: "relative" },
  logoImage: { width: 120, height: 90, borderRadius: 12 },
  logoPlaceholder: {
    width: 120, height: 90, borderRadius: 12,
    borderWidth: 2, borderStyle: "dashed", borderColor: Colors.border,
    alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.surfaceAlt,
  },
  logoPlaceholderText: { fontSize: 12, color: Colors.textMuted },
  editBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center",
  },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 6 },
  input: {
    height: 50, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background, paddingHorizontal: 16, fontSize: 16, color: Colors.text,
  },
  taxOptions: {
    flexDirection: "row", gap: 8, marginTop: 4,
  },
  taxChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt, alignItems: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  taxChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  taxChipText: {
    fontSize: 14, fontWeight: "600", color: Colors.textSecondary,
  },
  taxChipTextActive: {
    color: Colors.primary,
  },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  saveBtn: { marginBottom: 16 },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  accountEmail: { fontSize: 14, color: Colors.textSecondary },
  logoutBtn: {},
});
