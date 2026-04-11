# Cotizador App

App móvil para crear y gestionar cotizaciones en México. Desarrollada con Expo (React Native) + TypeScript + Supabase.

## Funcionalidades

- Autenticación (login / registro / recuperar contraseña)
- CRUD de Clientes
- CRUD de Cotizaciones con ítems y cálculo de IVA
- Historial con filtros (Todos / Borrador / Enviado)
- Folio consecutivo seguro (RPC atómico en Supabase)
- Generación de PDF y compartir (WhatsApp, Email, etc.)
- Ajustes del negocio (nombre, prefijo de folio, IVA, logo)

---

## 1. Configuración de Supabase

### 1.1 Crear proyecto
1. Ve a [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Anota la **Project URL** y la **anon public key** (Project Settings → API).

### 1.2 Ejecutar el SQL
1. En el dashboard de Supabase, ve a **SQL Editor**.
2. Copia y pega el contenido de `supabase_setup.sql`.
3. Ejecuta el script completo.

Esto creará:
- Tablas: `customers`, `quotes`, `quote_items`, `org_settings`, `quote_counters`
- Políticas RLS (cada usuario solo ve sus datos)
- Función RPC `generate_next_quote_number` para folios consecutivos seguros
- Bucket de Storage `logos` para subir el logo del negocio

### 1.3 Habilitar Email Auth
En Supabase Dashboard → Authentication → Providers → Email → asegúrate que esté habilitado.

---

## 2. Variables de entorno

Crea un archivo `.env` en la raíz del proyecto cotizador_replit/artifacts/mobile/ (o usa las secrets de Replit):

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
```

---

## 3. Correr en Expo Go

### Requisitos
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo Go instalado en tu teléfono

### Pasos

```bash
# Instalar dependencias desde la raíz del monorepo
pnpm install

# Iniciar el servidor de desarrollo
pnpm --filter @workspace/mobile run dev 
ó
npx expo start
```

Escanea el código QR con Expo Go (Android) o la cámara (iOS).

---

## 4. Generar APK para Android

### Método recomendado: Natively (sin cuenta de desarrollador)

1. Ve a [natively.app](https://natively.app) y crea una cuenta gratuita.
2. Conecta tu repositorio de GitHub o sube el código.
3. En el dashboard de Natively:
   - Selecciona **Deploy → Build APK**
   - Plataforma: **Android**
   - Tipo de build: **APK** (no AAB, para instalación directa)
4. Espera a que termine el build (10-15 minutos).
5. Descarga el APK generado.
6. Comparte el archivo APK con tus compañeros por WhatsApp o Google Drive.
7. En el teléfono Android: activar **"Instalar desde fuentes desconocidas"** en Configuración → Seguridad, luego instalar el APK.

### Método alternativo: EAS Build (requiere cuenta Expo)

El monorepo vive en la carpeta **`Cotizador_replit`** (raíz del repo Git). Los comandos de EAS se ejecutan desde **`Cotizador_replit/artifacts/mobile`**, donde están `app.json` y `eas.json`.

1. **Sube todo el monorepo a GitHub** (debe existir `artifacts/mobile/package.json` en el remoto). Haz commit de `eas.json`, `pnpm-lock.yaml` y el resto del proyecto.
2. Después de clonar o en tu PC, en la raíz del monorepo: `pnpm install` (en Windows, si falla el `preinstall`, usa `pnpm install --ignore-scripts`).
3. Abre una terminal en **`artifacts/mobile`** y ejecuta:

```bash
# Instalar EAS CLI (una vez)
npm install -g eas-cli

# Sesión Expo
eas login

# Solo la primera vez o si falta configuración local
eas build:configure

# APK de prueba (perfil preview en eas.json)
eas build --platform android --profile preview
```

El APK queda en [expo.dev](https://expo.dev) (pestaña Builds del proyecto). El perfil `preview` genera **APK** y define las variables `EXPO_PUBLIC_*` de Supabase para el build.

---

## Stack técnico

| Tecnología | Uso |
|---|---|
| Expo 54 + React Native | Framework móvil |
| expo-router | Navegación file-based |
| TypeScript | Tipado estático |
| Supabase | Auth + Base de datos + Storage |
| TanStack Query | Data fetching y caché |
| react-hook-form + zod | Formularios y validación |
| expo-print | Generación de PDF |
| expo-sharing | Compartir archivos |
| date-fns | Manejo de fechas |
| NativeWind / StyleSheet | Estilos |
