import React, { useState } from 'react';
import UploadArea from './UploadArea';
import { extractInvoiceData } from '../services/geminiService';
import { InvoiceData, ExtractionStatus } from '../types';

const InvoiceTab: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setErrorMsg(null);
  };

  const processFiles = async () => {
    if (files.length === 0) {
      setErrorMsg("Please upload at least one invoice file first.");
      return;
    }

    setStatus('processing');
    setErrorMsg(null);

    const newInvoices: InvoiceData[] = [];
    
    // Process strictly one by one to show progress or handle partial failure gracefully
    // (Could be parallelized, but sequential feels safer for rate limits in a prototype)
    for (const file of files) {
      try {
        const data = await extractInvoiceData(file);
        
        // Transform partial data to full InvoiceData with safe defaults
        const invoice: InvoiceData = {
          id: Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          invoice_number: data.invoice_number ?? null,
          invoice_date: data.invoice_date ?? null,
          supplier_name: data.supplier_name ?? "Unknown Supplier",
          supplier_tax_id: data.supplier_tax_id ?? null,
          total_amount: data.total_amount ?? 0,
          currency: data.currency ?? 'USD',
          tax_amount: data.tax_amount ?? 0,
          line_items: data.line_items ?? [],
        };
        newInvoices.push(invoice);
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        // Continue processing other files, just alert user at end or show partial error
        // For simplicity, we just add a "Failed" placeholder or skip.
        // Let's create a placeholder to show it failed.
        newInvoices.push({
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.name,
            invoice_number: 'ERROR',
            invoice_date: null,
            supplier_name: 'Extraction Failed',
            supplier_tax_id: null,
            total_amount: 0,
            currency: '',
            tax_amount: 0,
            line_items: []
        });
      }
    }

    setInvoices(prev => [...prev, ...newInvoices]);
    setFiles([]); // Clear queue
    setStatus('success');
  };

  const handleDownloadCSV = () => {
    if (invoices.length === 0) return;

    const headers = [
      "Invoice #",
      "Date",
      "Supplier",
      "Tax ID",
      "Total",
      "Currency",
      "Tax",
      "Line Items Count"
    ];

    const rows = invoices.map(inv => [
      inv.invoice_number || "",
      inv.invoice_date || "",
      `"${inv.supplier_name || ""}"`, // Escape commas
      inv.supplier_tax_id || "",
      inv.total_amount || 0,
      inv.currency || "",
      inv.tax_amount || 0,
      inv.line_items.length
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "extracted_invoices.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Invoices</h2>
        <UploadArea 
          label="Drop invoices here (PDF, JPG, PNG)" 
          onFilesSelected={handleFilesSelected}
          disabled={status === 'processing'}
        />
        
        {files.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                    {files.length} file{files.length > 1 ? 's' : ''} ready to process.
                </span>
                <button
                    onClick={processFiles}
                    disabled={status === 'processing'}
                    className={`
                        px-6 py-2 rounded-lg font-medium text-white shadow-sm transition-all
                        ${status === 'processing' 
                            ? 'bg-blue-400 cursor-wait' 
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow'
                        }
                    `}
                >
                    {status === 'processing' ? 'Processing with Gemini...' : 'Extract Data'}
                </button>
            </div>
        )}
        
        {errorMsg && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
                {errorMsg}
            </div>
        )}
      </div>

      {/* Results Section */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Extraction Results</h3>
                <button 
                    onClick={handleDownloadCSV}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 16.5m0 0L16.5 12M12 16.5V3" />
                    </svg>
                    Download CSV
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inv #</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Items</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate" title={inv.fileName}>{inv.fileName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.invoice_date || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.supplier_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.invoice_number || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-gray-900">
                                    {inv.currency} {inv.total_amount?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <details className="group cursor-pointer">
                                        <summary className="list-none text-blue-600 text-xs font-medium flex items-center gap-1">
                                            {inv.line_items.length} items
                                            <span className="group-open:rotate-180 transition-transform">▼</span>
                                        </summary>
                                        <div className="absolute mt-2 p-3 bg-white border shadow-xl rounded-lg z-10 w-64 -ml-40">
                                            <ul className="space-y-2 max-h-40 overflow-y-auto text-xs">
                                                {inv.line_items.map((item, idx) => (
                                                    <li key={idx} className="border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                                        <div className="font-medium text-gray-800">{item.description}</div>
                                                        <div className="flex justify-between text-gray-500">
                                                            <span>x{item.quantity}</span>
                                                            <span>{item.line_total}</span>
                                                        </div>
                                                    </li>
                                                ))}
                                                {inv.line_items.length === 0 && <li>No line items detected</li>}
                                            </ul>
                                        </div>
                                    </details>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceTab;
