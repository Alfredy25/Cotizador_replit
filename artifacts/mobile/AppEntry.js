import { ExpoRoot } from "expo-router";

/**
 * Debe estar en un archivo distinto al que registra la raíz (ver expo-router qualified-entry).
 * require.context('./app') evita el fallo de EXPO_ROUTER_APP_ROOT en EAS + monorepo/pnpm.
 */
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}
