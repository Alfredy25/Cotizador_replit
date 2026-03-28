import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const email = watch("email");
  const password = watch("password");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
        });
        if (error) throw error;
        Alert.alert("Cuenta creada", "Revisa tu correo para confirmar tu cuenta.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!email) {
      Alert.alert("Ingresa tu correo", "Escribe tu correo para recuperar tu contraseña.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Correo enviado", "Revisa tu bandeja de entrada para restablecer tu contraseña.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>C</Text>
          </View>
          <Text style={styles.title}>Cotizador</Text>
          <Text style={styles.subtitle}>
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta gratuita"}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => setValue("email", v, { shouldValidate: true })}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="••••••"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={(v) => setValue("password", v, { shouldValidate: true })}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          {mode === "login" && (
            <Pressable onPress={onForgotPassword} style={styles.forgotLink}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          )}

          <Button
            title={mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
            </Text>
            <Pressable onPress={() => setMode(mode === "login" ? "register" : "login")}>
              <Text style={styles.switchLink}>
                {mode === "login" ? "Crear Cuenta" : "Iniciar Sesión"}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: "800", color: Colors.white },
  title: { fontSize: 28, fontWeight: "800", color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: "center" },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  inputError: { borderColor: Colors.danger },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4 },
  forgotLink: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { fontSize: 14, color: Colors.primary, fontWeight: "500" },
  submitBtn: { marginTop: 4, marginBottom: 20 },
  switchRow: { flexDirection: "row", justifyContent: "center", gap: 6 },
  switchLabel: { fontSize: 14, color: Colors.textSecondary },
  switchLink: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
});
