-- ============================================================
-- COTIZADOR APP – Supabase Setup SQL
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLAS ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  number      TEXT,
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent')),
  issue_date  DATE DEFAULT CURRENT_DATE,
  currency    TEXT DEFAULT 'MXN',
  subtotal    NUMERIC(12,2) DEFAULT 0,
  tax_total   NUMERIC(12,2) DEFAULT 0,
  total       NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quote_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id    UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty         NUMERIC(12,4) DEFAULT 1,
  unit_price  NUMERIC(12,4) DEFAULT 0,
  tax_rate    NUMERIC(6,4)  DEFAULT 0.16,
  line_total  NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS org_settings (
  user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT '',
  logo_url      TEXT,
  folio_prefix  TEXT DEFAULT 'COT',
  default_tax   NUMERIC(6,4) DEFAULT 0.16
);

CREATE TABLE IF NOT EXISTS quote_counters (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_value BIGINT DEFAULT 0
);

-- ─── RLS ─────────────────────────────────────────────────────

ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_counters ENABLE ROW LEVEL SECURITY;

-- Customers
CREATE POLICY "customers_own" ON customers
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quotes
CREATE POLICY "quotes_own" ON quotes
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quote Items (via quote ownership)
CREATE POLICY "quote_items_own" ON quote_items
  USING (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_items.quote_id
        AND q.user_id = auth.uid()
    )
  );

-- Org Settings
CREATE POLICY "org_settings_own" ON org_settings
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Quote Counters
CREATE POLICY "quote_counters_own" ON quote_counters
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── RPC: Folio consecutivo seguro ───────────────────────────

CREATE OR REPLACE FUNCTION generate_next_quote_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix   TEXT;
  v_next     BIGINT;
  v_folio    TEXT;
BEGIN
  -- Obtener prefijo del negocio
  SELECT COALESCE(folio_prefix, 'COT')
  INTO v_prefix
  FROM org_settings
  WHERE user_id = p_user_id;

  IF v_prefix IS NULL THEN
    v_prefix := 'COT';
  END IF;

  -- Insertar o incrementar el contador de forma atómica
  INSERT INTO quote_counters (user_id, last_value)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET last_value = quote_counters.last_value + 1
  RETURNING last_value INTO v_next;

  -- Formatear folio: PREFIJO-000001
  v_folio := v_prefix || '-' || LPAD(v_next::TEXT, 6, '0');

  RETURN v_folio;
END;
$$;

-- ─── STORAGE: Bucket para logos ───────────────────────────────
-- Ejecutar esto SOLO si tu plan lo permite, o configúralo en el Dashboard:
-- Storage → New bucket → nombre: "logos" → Public: true

INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "logos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
