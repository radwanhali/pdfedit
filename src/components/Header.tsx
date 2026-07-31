import React from 'react';
import { Printer, Download, Plus, FileSpreadsheet, Eye, Edit3, Save, Check, Loader2 } from 'lucide-react';

interface HeaderProps {
  contractNumber: string;
  isSaved: boolean;
  viewMode: 'edit' | 'preview' | 'split';
  setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
  onPrint: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  onCreateNew: () => void;
  onSave: () => void;
  showSidebar: boolean;
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  contractNumber,
  isSaved,
  viewMode,
  setViewMode,
  onPrint,
  onExportPdf,
  isExportingPdf = false,
  onCreateNew,
  onSave,
  showSidebar,
  toggleSidebar,
}) => {

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <svg className="w-5 h-5" viewBox="0 0 100 100" fill="none">
              <polygon points="50,5 95,35 75,95 25,95 5,35" fill="#ffffff" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">
                سبائك الماسة - اتفاقية خدمة
              </h1>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                عقد #{contractNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              نظام توثيق العقود الذكي والتصدير إلى A4 PDF
            </p>
          </div>
        </div>

        {/* View mode toggle for desktop */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === 'split' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عرض مزدوج (تعديل + معاينة)
          </button>
          <button
            onClick={() => setViewMode('edit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              viewMode === 'edit' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            تعديل البيانات
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1 ${
              viewMode === 'preview' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            المعاينة الطباعية A4
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${
              showSidebar
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">العقود المحفوظة</span>
          </button>

          {/* Quick Save button */}
          <button
            onClick={onSave}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 border ${
              isSaved
                ? 'bg-slate-50 text-emerald-700 border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'محفوظ' : 'حفظ العقد'}</span>
          </button>

          {/* Download PDF button */}
          <button
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className={`px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs ${
              isExportingPdf ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isExportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}
            </span>
          </button>


          {/* Print button */}
          <button
            onClick={onPrint}
            className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
