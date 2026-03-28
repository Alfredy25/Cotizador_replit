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

Crea un archivo `.env` en la raíz del proyecto (o usa las secrets de Replit):

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

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login con tu cuenta de Expo
eas login

# Configurar el proyecto
eas build:configure

# Generar APK
eas build --platform android --profile preview
```

El APK estará disponible para descargar en [expo.dev](https://expo.dev).

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
