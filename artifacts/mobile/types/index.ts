export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  qty: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

export type QuoteStatus = "draft" | "sent";

export interface Quote {
  id: string;
  user_id: string;
  customer_id?: string;
  number?: string;
  status: QuoteStatus;
  issue_date: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  total: number;
  created_at: string;
  customer?: Customer;
  items?: QuoteItem[];
}

export interface OrgSettings {
  user_id: string;
  business_name: string;
  logo_url?: string;
  folio_prefix: string;
  default_tax: number;
}

export interface QuoteCounter {
  user_id: string;
  last_value: number;
}

export interface LocalQuoteItem {
  id: string;
  description: string;
  qty: string;
  unit_price: string;
  tax_rate: number;
}
