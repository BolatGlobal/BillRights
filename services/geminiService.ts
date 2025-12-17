import { GoogleGenAI, Type, Schema } from "@google/genai";
import { InvoiceData, BusinessCardData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-pro-preview"; // Using Gemini 3 as requested

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Content = base64String.split(",")[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- INVOICE EXTRACTION ---

const invoiceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    invoice_number: { type: Type.STRING, description: "The invoice number or identifier" },
    invoice_date: { type: Type.STRING, description: "The date of the invoice (YYYY-MM-DD preferred)" },
    supplier_name: { type: Type.STRING, description: "Name of the supplier or vendor" },
    supplier_tax_id: { type: Type.STRING, description: "Tax ID, VAT ID, or GST number of the supplier" },
    total_amount: { type: Type.NUMBER, description: "The total final amount of the invoice" },
    currency: { type: Type.STRING, description: "Currency code (e.g., USD, EUR)" },
    tax_amount: { type: Type.NUMBER, description: "Total tax amount (VAT/GST)" },
    line_items: {
      type: Type.ARRAY,
      description: "List of items purchased",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit_price: { type: Type.NUMBER },
          line_total: { type: Type.NUMBER },
        },
        required: ["description", "line_total"],
      },
    },
  },
  required: ["supplier_name", "total_amount"],
};

export const extractInvoiceData = async (file: File): Promise<Partial<InvoiceData>> => {
  const filePart = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      role: "user",
      parts: [
        filePart,
        { text: "Extract the following invoice data from this document. Return JSON." },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: invoiceSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from model");

  try {
    return JSON.parse(text) as Partial<InvoiceData>;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse model response");
  }
};

// --- BUSINESS CARD EXTRACTION ---

const businessCardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    full_name: { type: Type.STRING, description: "Full name of the person" },
    company: { type: Type.STRING, description: "Company name" },
    job_title: { type: Type.STRING, description: "Job title or role" },
    email: { type: Type.STRING, description: "Email address" },
    phone: { type: Type.STRING, description: "Phone number" },
    website: { type: Type.STRING, description: "Website URL" },
    address: { type: Type.STRING, description: "Physical address" },
  },
  required: ["full_name"],
};

export const extractBusinessCardData = async (file: File): Promise<Partial<BusinessCardData>> => {
  const filePart = await fileToGenerativePart(file);

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      role: "user",
      parts: [
        filePart,
        { text: "Extract contact details from this business card. Return JSON." },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: businessCardSchema,
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from model");

  try {
    return JSON.parse(text) as Partial<BusinessCardData>;
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse model response");
  }
};
