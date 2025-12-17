import React, { useState } from 'react';
import UploadArea from './UploadArea';
import { extractBusinessCardData } from '../services/geminiService';
import { BusinessCardData, ExtractionStatus } from '../types';

const BusinessCardTab: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [cards, setCards] = useState<BusinessCardData[]>([]);
  const [status, setStatus] = useState<ExtractionStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setErrorMsg(null);
  };

  const processFiles = async () => {
    if (files.length === 0) {
      setErrorMsg("Please upload at least one business card.");
      return;
    }

    setStatus('processing');
    setErrorMsg(null);

    const newCards: BusinessCardData[] = [];

    for (const file of files) {
      try {
        const data = await extractBusinessCardData(file);
        
        const card: BusinessCardData = {
          id: Math.random().toString(36).substr(2, 9),
          fileName: file.name,
          full_name: data.full_name ?? "Unknown",
          company: data.company ?? null,
          job_title: data.job_title ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          address: data.address ?? null,
        };
        newCards.push(card);
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        newCards.push({
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.name,
            full_name: "Extraction Failed",
            company: null,
            job_title: null,
            email: null,
            phone: null,
            website: null,
            address: null,
        });
      }
    }

    setCards(prev => [...prev, ...newCards]);
    setFiles([]); 
    setStatus('success');
  };

  const getGoogleContactsText = () => {
    if (cards.length === 0) return "";
    // Header format helps user understand, but often plain text copy is best with just delimiters
    // Format: Full Name; Company; Job Title; Email; Phone; Website; Address
    return cards.map(c => {
      return `${c.full_name || ''}; ${c.company || ''}; ${c.job_title || ''}; ${c.email || ''}; ${c.phone || ''}; ${c.website || ''}; ${c.address || ''}`;
    }).join('\n');
  };

  const handleCopyToClipboard = () => {
    const text = getGoogleContactsText();
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Business Cards</h2>
        <UploadArea 
          label="Drop business card images here" 
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
                            ? 'bg-purple-400 cursor-wait' 
                            : 'bg-purple-600 hover:bg-purple-700 hover:shadow'
                        }
                    `}
                >
                    {status === 'processing' ? 'Reading Cards...' : 'Extract Data'}
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
      {cards.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table View */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                 <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Extracted Contacts</h3>
                </div>
                <div className="overflow-x-auto flex-grow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {cards.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-gray-900">{c.full_name}</div>
                                        <div className="text-xs text-gray-500">{c.job_title}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {c.company || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        <div className="text-blue-600">{c.email}</div>
                                        <div>{c.phone}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Copy Action Panel */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col h-full">
                <h3 className="font-semibold text-gray-800 mb-2">Google Contacts Format</h3>
                <p className="text-xs text-gray-500 mb-3">
                    Copy and paste the text below. One line per contact.
                    <br />
                    <span className="italic">Name; Company; Title; Email; Phone; Website; Address</span>
                </p>
                <textarea 
                    readOnly
                    value={getGoogleContactsText()}
                    className="w-full flex-grow p-3 text-xs font-mono bg-gray-50 border border-gray-200 rounded-md mb-3 focus:outline-none resize-none h-48"
                />
                <button
                    onClick={handleCopyToClipboard}
                    className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
                        copyFeedback 
                        ? 'bg-green-100 text-green-700 border border-green-200' 
                        : 'bg-gray-800 text-white hover:bg-gray-900'
                    }`}
                >
                    {copyFeedback ? 'Copied!' : 'Copy to Clipboard'}
                </button>
            </div>

        </div>
      )}
    </div>
  );
};

export default BusinessCardTab;
