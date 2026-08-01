import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ContractData, ContractFieldPositions } from '../types';
import { ContractDocument } from './ContractDocument';
import { X, Move, Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
  const [zoomScale, setZoomScale] = useState<number>(1);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoomScale((prev) => Math.min(Number((prev + 0.15).toFixed(2)), 2.5));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(Number((prev - 0.15).toFixed(2)), 0.4));
  const handleResetZoom = () => setZoomScale(1);

  // Multi-touch pinch-to-zoom gesture handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null && initialPinchDistRef.current > 0) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / initialPinchDistRef.current;
      const newZoom = Math.min(Math.max(initialZoomRef.current * ratio, 0.4), 2.5);
      setZoomScale(Number(newZoom.toFixed(2)));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-between p-2 sm:p-4 overflow-hidden"
      dir="rtl"
    >
      {/* Modal Box Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl h-full max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 my-auto relative">
        {/* Modal Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs shrink-0 z-20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800">
                معاينة العقد النهائي رقم #{contract.contractNumber || 'جديد'}
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                {contract.secondPartyName ? `العميل: ${contract.secondPartyName}` : 'معاينة النموذج التفاعلي'}
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="تصغير المعاينة"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-2 text-[11px] font-mono font-bold text-slate-700 hover:bg-white rounded py-0.5"
                title="إعادة ضبط المقياس 100%"
              >
                {Math.round(zoomScale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="تكبير المعاينة"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Field positioning toggle button */}
            <button
              type="button"
              onClick={onTogglePositioningMode}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isPositioningMode
                  ? 'bg-amber-600 border-amber-700 text-white shadow-xs animate-pulse'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
              }`}
              title="تفعيل سحب وتحريك مواضع الحقول بالماوس أو الإصبع مباشرة"
            >
              <Move className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isPositioningMode ? 'إيقاف التحريك' : 'تحريك الحقول'}</span>
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
          <div className="bg-amber-500 text-white text-xs px-3 py-1.5 flex items-center justify-between font-semibold shrink-0 z-20">
            <div className="flex items-center gap-2">
              <Move className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>وضع تحريك الحقول مفعل: اضغط مع الاستمرار واسحب أي نص أو كيو ار الخريطة بيدك إلى مكانه.</span>
            </div>
            <button
              onClick={onTogglePositioningMode}
              className="bg-amber-700 hover:bg-amber-800 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-xs"
            >
              حفظ وإغلاق التحريك
            </button>
          </div>
        )}

        {/* Modal Body: Responsive Scrollable Canvas with Pinch-to-Zoom Touch Listener */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="p-2 sm:p-6 bg-slate-200/80 overflow-auto flex-1 flex justify-center items-start min-h-0 w-full relative select-none touch-pan-x touch-pan-y"
        >
          <div
            className="transition-transform duration-75 ease-out origin-top w-full max-w-[794px] bg-white shadow-2xl rounded-sm overflow-hidden"
            style={{
              transform: `scale(${zoomScale})`,
              marginBottom: zoomScale < 1 ? `-${(1 - zoomScale) * 100}%` : '0px',
            }}
          >
            <ContractDocument
              contract={contract}
              isPositioningMode={isPositioningMode}
              onPositionChange={onPositionsChange}
            />
          </div>

          {/* Quick Floating Zoom Overlay for Mobile */}
          <div className="fixed bottom-6 left-6 z-30 sm:hidden flex items-center gap-1 bg-slate-900/90 text-white p-1 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md">
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 active:bg-slate-700 text-white"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-xs font-mono font-bold"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-800 active:bg-slate-700 text-white"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
