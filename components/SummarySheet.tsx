
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';

export const SummarySheet: React.FC<{ items: string[] }> = ({ items }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      
      // Styles
      const margin = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const title = "Study Summary - NoteMakerAI";
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(79, 70, 229); // Indigo-600
      doc.text(title, margin, 30);
      
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(margin, 35, pageWidth - margin, 35);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59); // Slate-800
      
      let cursorY = 50;
      const lineHeight = 8;
      const wrapWidth = pageWidth - (margin * 2) - 10;

      items.forEach((item, index) => {
        const prefix = `${index + 1}. `;
        const lines = doc.splitTextToSize(item, wrapWidth);
        
        // Check if we need a new page
        if (cursorY + (lines.length * lineHeight) > 280) {
          doc.addPage();
          cursorY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(prefix, margin, cursorY);
        
        doc.setFont("helvetica", "normal");
        doc.text(lines, margin + 10, cursorY);
        
        cursorY += (lines.length * lineHeight) + 6;
      });

      doc.save("Study_Summary_NoteMakerAI.pdf");
    } catch (error) {
      console.error("Failed to generate PDF", error);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Key Takeaways</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-2">Condensed Study Guide</p>
        </div>
        <button 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="mt-6 md:mt-0 flex items-center justify-center px-6 py-3 bg-indigo-50 text-indigo-600 font-black rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group active:scale-95 disabled:opacity-50"
        >
          {isDownloading ? (
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3 group-hover:border-white group-hover:border-t-transparent" />
          ) : (
            <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {isDownloading ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      
      <ul className="space-y-8">
        {items.map((item, i) => (
          <li key={i} className="flex items-start group">
            <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-sm mr-6 mt-1 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-100 transition-all duration-300">
              {(i + 1).toString().padStart(2, '0')}
            </span>
            <p className="text-xl text-slate-700 font-medium leading-relaxed pt-1">{item}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
