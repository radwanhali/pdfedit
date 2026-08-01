import React from 'react';
import { Printer, Download, Plus, Eye, Save, Check, Loader2 } from 'lucide-react';

interface HeaderProps {
  contractNumber: string;
  isSaved: boolean;
  onPrint: () => void;
  onExportPdf: () => void;
  isExportingPdf?: boolean;
  onCreateNew: () => void;
  onSave: () => void;
  onOpenPreviewModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  contractNumber,
  isSaved,
  onPrint,
  onExportPdf,
  isExportingPdf = false,
  onCreateNew,
  onSave,
  onOpenPreviewModal,
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
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-md border border-blue-200">
                عقد #{contractNumber || 'جديد'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              نظام إدارة وتوثيق العقود وتوليد كيو ار الخريطة والطباعة A4
            </p>
          </div>
        </div>

        {/* Primary Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* New Contract Button */}
          <button
            type="button"
            onClick={onCreateNew}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>عقد جديد</span>
          </button>

          {/* Show Preview Contract Modal Button */}
          <button
            type="button"
            onClick={onOpenPreviewModal}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            title="عرض معاينة العقد بشاشه منبثقة"
          >
            <Eye className="w-4 h-4" />
            <span>عرض العقد</span>
          </button>

          {/* Quick Save button */}
          <button
            type="button"
            onClick={onSave}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isSaved
                ? 'bg-slate-50 text-emerald-700 border-emerald-300'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4" />}
            <span>{isSaved ? 'محفوظ' : 'حفظ'}</span>
          </button>

          {/* Download PDF button */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isExportingPdf}
            className={`px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
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
            type="button"
            onClick={onPrint}
            className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>طباعة</span>
          </button>
        </div>
      </div>
    </header>
  );
};
