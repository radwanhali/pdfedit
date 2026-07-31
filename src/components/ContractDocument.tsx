import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ContractData, ContractFieldPositions } from '../types';
import { DEFAULT_FIELD_POSITIONS } from '../utils/contractDefaults';
import { Move, RotateCcw } from 'lucide-react';

interface ContractDocumentProps {
  contract: ContractData;
  onPositionChange?: (updatedPositions: ContractFieldPositions) => void;
  isPositioningMode?: boolean;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  contract,
  onPositionChange,
  isPositioningMode = false,
}) => {
  const [activeDraggingField, setActiveDraggingField] = useState<keyof ContractFieldPositions | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Merge default positions with customized positions
  const pos: ContractFieldPositions = {
    ...DEFAULT_FIELD_POSITIONS,
    ...(contract.fieldPositions || {}),
  };

  const handleMouseDown = (fieldKey: keyof ContractFieldPositions, e: React.MouseEvent) => {
    if (!isPositioningMode || !onPositionChange) return;
    e.preventDefault();
    e.stopPropagation();
    setActiveDraggingField(fieldKey);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDraggingField || !isPositioningMode || !onPositionChange || !svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(794, Math.round(((e.clientX - rect.left) / rect.width) * 794)));
    const y = Math.max(0, Math.min(1123, Math.round(((e.clientY - rect.top) / rect.height) * 1123)));

    const updated = {
      ...pos,
      [activeDraggingField]: { x, y },
    };
    onPositionChange(updated);
  };

  const handleMouseUp = () => {
    setActiveDraggingField(null);
  };

  const handleResetPositions = () => {
    if (onPositionChange) {
      onPositionChange(DEFAULT_FIELD_POSITIONS);
    }
  };

  const getDraggableProps = (fieldKey: keyof ContractFieldPositions) => {
    const isSelected = activeDraggingField === fieldKey;
    if (!isPositioningMode) return {};

    return {
      onMouseDown: (e: React.MouseEvent) => handleMouseDown(fieldKey, e),
      className: `cursor-move select-none transition-opacity ${
        isSelected ? 'opacity-70 ring-2 ring-blue-500 ring-offset-1' : 'hover:opacity-80'
      }`,
    };
  };

  return (
    <div className="relative group/doc w-full max-w-[794px] mx-auto">
      {/* Position Adjustment Toolbar Notification */}
      {isPositioningMode && (
        <div className="mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span className="font-bold">وضع تحديد ومواضع الحقول:</span>
            <span>انقر واسحب أي حقل أو QR خريطة الموقع لتعديل موقعه بدقة فوق الورقة.</span>
          </div>
          <button
            type="button"
            onClick={handleResetPositions}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            إعادة للمواضع الأصلية
          </button>
        </div>
      )}

      {/* Main Printable Document Sheet - Direct HTML/SVG Canvas without External Images */}
      <div
        id="printable-contract"
        dir="ltr"
        className={`bg-white text-slate-900 mx-auto font-sans relative shadow-2xl print:shadow-none print:m-0 print:p-0 print:w-[210mm] print:h-[297mm] print:max-w-none overflow-hidden select-none w-full max-w-[794px] aspect-[794/1123] ${
          isPositioningMode ? 'ring-2 ring-blue-500/50' : ''
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Background Image Layer (Rendered only if backgroundImageUrl is specified) */}
        {contract.backgroundImageUrl && (
          <img
            src={contract.backgroundImageUrl}
            alt="خلفية نموذج العقد"
            className="w-full h-full object-fill absolute inset-0 pointer-events-none select-none"
          />
        )}

        {/* Dynamic Text Fields and Drag SVG Overlay */}
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 794 1123"
          dir="ltr"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-full absolute inset-0 block ${
            isPositioningMode ? 'cursor-crosshair' : 'pointer-events-none'
          }`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Paper Canvas (Transparent if background image is present, white if not) */}
          <rect width="794" height="1123" fill={contract.backgroundImageUrl ? 'transparent' : '#ffffff'} />

          {/* Dynamic Contract Preamble Text Fields */}
          <g
            fontFamily="'Traditional Arabic', 'Amiri', 'Segoe UI', 'Sakkal Majalla', serif, sans-serif"
            fill="#000000"
            fontWeight="900"
            style={{ fontWeight: 900, textRendering: 'geometricPrecision' }}
          >
            {/* Contract Number */}
            <g {...getDraggableProps('contractNumber')}>
              <text
                x={pos.contractNumber.x}
                y={pos.contractNumber.y}
                fontSize="14"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="middle"
                fill="#000000"
              >
                {contract.contractNumber || ''}
              </text>
            </g>

            {/* Start Gregorian Date */}
            <g {...getDraggableProps('startDate')}>
              <text
                x={pos.startDate.x}
                y={pos.startDate.y}
                fontSize="11.5"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="middle"
                fill="#000000"
              >
                {contract.startDate || ''}
              </text>
            </g>

            {/* Start Hijri Date */}
            <g {...getDraggableProps('startHijriDate')}>
              <text
                x={pos.startHijriDate.x}
                y={pos.startHijriDate.y}
                fontSize="13"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="middle"
                direction="rtl"
                unicodeBidi="embed"
                fill="#000000"
              >
                {contract.startHijriDate || ''}
              </text>
            </g>

            {/* End Gregorian Date */}
            <g {...getDraggableProps('endDate')}>
              <text
                x={pos.endDate.x}
                y={pos.endDate.y}
                fontSize="11.5"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="middle"
                fill="#000000"
              >
                {contract.endDate || ''}
              </text>
            </g>

            {/* End Hijri Date */}
            <g {...getDraggableProps('endHijriDate')}>
              <text
                x={pos.endHijriDate.x}
                y={pos.endHijriDate.y}
                fontSize="13"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="end"
                direction="rtl"
                unicodeBidi="embed"
                fill="#000000"
              >
                {contract.endHijriDate || ''}
              </text>
            </g>

            {/* Second Party (Client Name) */}
            <g {...getDraggableProps('secondPartyName')}>
              <text
                x={pos.secondPartyName.x}
                y={pos.secondPartyName.y}
                textAnchor="end"
                fontSize="14"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                direction="rtl"
                unicodeBidi="embed"
                fill="#000000"
              >
                {contract.secondPartyName || ''}
              </text>
            </g>

            {/* Second Party Address */}
            <g {...getDraggableProps('secondPartyAddress')}>
              <text
                x={pos.secondPartyAddress.x}
                y={pos.secondPartyAddress.y}
                fontSize="13.5"
                fontWeight="900"
                style={{ fontWeight: 900 }}
                textAnchor="end"
                direction="rtl"
                unicodeBidi="embed"
                fill="#000000"
              >
                {contract.secondPartyAddress || ''}
              </text>
            </g>
          </g>
        </svg>

        {/* Location Google Maps QR Code Overlay */}
        {contract.showLocationQr && contract.googleMapsUrl && (
          <div
            style={{
              position: 'absolute',
              left: `${(pos.locationQr.x / 794) * 100}%`,
              top: `${(pos.locationQr.y / 1123) * 100}%`,
              width: '9.06%', // 72px / 794px
              height: '6.41%', // 72px / 1123px
              zIndex: 20,
            }}
            onMouseDown={(e) => handleMouseDown('locationQr', e)}
            className={`bg-white p-1 rounded border border-slate-300 shadow-sm flex items-center justify-center select-none ${
              isPositioningMode ? 'cursor-move ring-2 ring-emerald-500' : 'pointer-events-none'
            }`}
          >
            <QRCodeSVG
              value={contract.googleMapsUrl}
              size={64}
              level="M"
              fgColor="#000000"
              className="w-full h-full"
            />
          </div>
        )}

      </div>
    </div>
  );
};

