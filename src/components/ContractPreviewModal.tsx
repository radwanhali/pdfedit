import React from 'react';
import { createPortal } from 'react-dom';
import { ContractData, ContractFieldPositions } from '../types';
import { ContractDocument } from './ContractDocument';
import { X, Move, Eye } from 'lucide-react';

interface ContractPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: ContractData;
  isPositioningMode: boolean;
  onTogglePositioningMode: () => void;
  onPositionsChange: (positions: ContractFieldPositions) => void;
}

export const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  isOpen,
  onClose,
  contract,
  isPositioningMode,
  onTogglePositioningMode,
  onPositionsChange,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/75 backdrop-blur-xs flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 overflow-y-auto"
      dir="rtl"
    >
      {/* Modal Card Box */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-[850px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto">
        {/* Modal Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                معاينة العقد النهائي رقم #{contract.contractNumber || 'جديد'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {contract.secondPartyName ? `العميل: ${contract.secondPartyName}` : 'نموذج معاينة العقد الجاهز للطباعة'}
              </p>
            </div>
          </div>

          {/* Header Controls: Field Positioning Toggle & Close */}
          <div className="flex items-center gap-2">
            {/* Field positioning toggle button inside preview modal */}
            <button
              type="button"
              onClick={onTogglePositioningMode}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isPositioningMode
                  ? 'bg-amber-600 border-amber-700 text-white shadow-xs animate-pulse'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
              title="تفعيل سحب وتحريك مواضع الحقول بالماوس مباشرة على العقد"
            >
              <Move className="w-4 h-4" />
              <span>{isPositioningMode ? 'إيقاف التحريك' : 'تحريك الحقول'}</span>
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Positioning Mode Notification Banner */}
        {isPositioningMode && (
          <div className="bg-amber-500 text-white text-xs px-4 py-2 flex items-center justify-between font-semibold">
            <div className="flex items-center gap-2">
              <Move className="w-4 h-4 animate-spin" />
              <span>وضع ضبط مواضع الحقول مفعل! اضغط واسحب أي نصوص على العقد لتغيير مكانها.</span>
            </div>
            <button
              onClick={onTogglePositioningMode}
              className="bg-amber-700 hover:bg-amber-800 text-white text-[11px] px-2.5 py-0.5 rounded"
            >
              تم
            </button>
          </div>
        )}

        {/* Modal Body: Render A4 Document Canvas */}
        <div className="p-3 sm:p-6 bg-slate-200/70 flex justify-center items-center overflow-auto max-h-[80vh]">
          <div className="w-full max-w-[794px] bg-white shadow-lg rounded-sm overflow-hidden">
            <ContractDocument
              contract={contract}
              isPositioningMode={isPositioningMode}
              onPositionChange={onPositionsChange}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
