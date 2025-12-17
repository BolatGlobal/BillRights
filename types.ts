export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface InvoiceData {
  id: string; // Internal unique ID for the UI
  fileName: string;
  invoice_number: string | null;
  invoice_date: string | null;
  supplier_name: string | null;
  supplier_tax_id: string | null;
  total_amount: number | null;
  currency: string | null;
  tax_amount: number | null;
  line_items: LineItem[];
}

export interface BusinessCardData {
  id: string; // Internal unique ID
  fileName: string;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
}

export type ExtractionStatus = 'idle' | 'processing' | 'success' | 'error';
