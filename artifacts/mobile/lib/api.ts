import { supabase } from "@/lib/supabase";
import { Customer, OrgSettings, Quote, QuoteItem } from "@/types";

// ─── Customers ───────────────────────────────────────────────────────────────

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCustomer(
  input: Omit<Customer, "id" | "user_id" | "created_at">
): Promise<Customer> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...input, user_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCustomer(
  id: string,
  input: Partial<Pick<Customer, "name" | "email" | "phone">>
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

// ─── Quotes ──────────────────────────────────────────────────────────────────

export async function fetchQuotes(status?: string): Promise<Quote[]> {
  let query = supabase
    .from("quotes")
    .select("*, customer:customers(id, name, email, phone)")
    .order("created_at", { ascending: false });
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchQuoteById(id: string): Promise<Quote> {
  const { data, error } = await supabase
    .from("quotes")
    .select("*, customer:customers(id, name, email, phone), items:quote_items(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createDraftQuote(
  customerId?: string,
  items?: Omit<QuoteItem, "id" | "quote_id">[],
  totals?: { subtotal: number; tax_total: number; total: number }
): Promise<Quote> {
  const { data: { user } } = await supabase.auth.getUser();
  const today = new Date().toISOString().split("T")[0];

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      user_id: user!.id,
      customer_id: customerId || null,
      status: "draft",
      issue_date: today,
      currency: "MXN",
      subtotal: totals?.subtotal ?? 0,
      tax_total: totals?.tax_total ?? 0,
      total: totals?.total ?? 0,
    })
    .select()
    .single();
  if (error) throw error;

  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      items.map((item) => ({ ...item, quote_id: quote.id }))
    );
    if (itemsError) throw itemsError;
  }

  return quote;
}

export async function updateQuote(
  id: string,
  customerId?: string,
  items?: Omit<QuoteItem, "id" | "quote_id">[],
  totals?: { subtotal: number; tax_total: number; total: number }
): Promise<Quote> {
  const today = new Date().toISOString().split("T")[0];

  const { data: quote, error } = await supabase
    .from("quotes")
    .update({
      customer_id: customerId || null,
      issue_date: today,
      subtotal: totals?.subtotal ?? 0,
      tax_total: totals?.tax_total ?? 0,
      total: totals?.total ?? 0,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Replace items
  await supabase.from("quote_items").delete().eq("quote_id", id);
  if (items && items.length > 0) {
    const { error: itemsError } = await supabase.from("quote_items").insert(
      items.map((item) => ({ ...item, quote_id: id }))
    );
    if (itemsError) throw itemsError;
  }

  return quote;
}

export async function finalizeQuote(id: string): Promise<Quote> {
  const { data, error } = await supabase.rpc("generate_next_quote_number", {
    p_user_id: (await supabase.auth.getUser()).data.user!.id,
  });
  if (error) throw error;

  const { data: quote, error: updateError } = await supabase
    .from("quotes")
    .update({ status: "sent", number: data })
    .eq("id", id)
    .select("*, customer:customers(id, name, email, phone), items:quote_items(*)")
    .single();
  if (updateError) throw updateError;
  return quote;
}

export async function deleteQuote(id: string): Promise<void> {
  await supabase.from("quote_items").delete().eq("quote_id", id);
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) throw error;
}

// ─── Org Settings ─────────────────────────────────────────────────────────────

export async function fetchOrgSettings(): Promise<OrgSettings | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("org_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertOrgSettings(
  settings: Partial<Omit<OrgSettings, "user_id">>
): Promise<OrgSettings> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("org_settings")
    .upsert({ user_id: user!.id, ...settings })
    .select()
    .single();
  if (error) throw error;
  return data;
}
