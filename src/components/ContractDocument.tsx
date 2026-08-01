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
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Merge default positions with customized positions
  const pos: ContractFieldPositions = {
    ...DEFAULT_FIELD_POSITIONS,
    ...(contract.fieldPositions || {}),
  };

  const handlePointerDown = (fieldKey: keyof ContractFieldPositions, e: React.PointerEvent) => {
    if (!isPositioningMode || !onPositionChange || !svgRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      const rawX = ((e.clientX - rect.left) / rect.width) * 794;
      const rawY = ((e.clientY - rect.top) / rect.height) * 1123;
      const currentPos = pos[fieldKey] || { x: 0, y: 0 };
      dragOffsetRef.current = {
        x: rawX - currentPos.x,
        y: rawY - currentPos.y,
      };
    }

    const target = e.currentTarget as HTMLElement | SVGElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn('Pointer capture error', err);
    }
    setActiveDraggingField(fieldKey);
  };

  const handlePointerMove = (fieldKey: keyof ContractFieldPositions, e: React.PointerEvent) => {
    if (activeDraggingField !== fieldKey || !isPositioningMode || !onPositionChange || !svgRef.current) return;
    e.preventDefault();

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawX = ((e.clientX - rect.left) / rect.width) * 794;
    const rawY = ((e.clientY - rect.top) / rect.height) * 1123;

    const targetX = rawX - dragOffsetRef.current.x;
    const targetY = rawY - dragOffsetRef.current.y;

    // Clamp coordinates within A4 page bounds
    const x = Math.max(10, Math.min(784, Math.round(targetX)));
    const y = Math.max(10, Math.min(1113, Math.round(targetY)));

    onPositionChange({
      ...pos,
      [fieldKey]: { x, y },
    });
  };

  const handlePointerUp = (fieldKey: keyof ContractFieldPositions, e: React.PointerEvent) => {
    if (activeDraggingField === fieldKey) {
      const target = e.currentTarget as HTMLElement | SVGElement;
      try {
        target.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      setActiveDraggingField(null);
    }
  };

  const handleResetPositions = () => {
    if (onPositionChange) {
      onPositionChange(DEFAULT_FIELD_POSITIONS);
    }
  };

  // Safe pointer listeners generator for draggable items
  const getPointerEvents = (fieldKey: keyof ContractFieldPositions) => {
    if (!isPositioningMode) return {};

    return {
      onPointerDown: (e: React.PointerEvent) => handlePointerDown(fieldKey, e),
      onPointerMove: (e: React.PointerEvent) => handlePointerMove(fieldKey, e),
      onPointerUp: (e: React.PointerEvent) => handlePointerUp(fieldKey, e),
      onPointerCancel: (e: React.PointerEvent) => handlePointerUp(fieldKey, e),
    };
  };

  return (
    <div className="relative group/doc w-full max-w-[794px] mx-auto">
      {/* Position Adjustment Toolbar Banner */}
      {isPositioningMode && (
        <div className="mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span className="font-bold">وضع تحريك الحقول باللمس/الماوس:</span>
            <span>اضغط واسحب أي نص أو كيو ار الخريطة مباشرة لوضعه في المكاني المطلوب.</span>
          </div>
          <button
            type="button"
            onClick={handleResetPositions}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            المواضع الأصلية
          </button>
        </div>
      )}

      {/* Main Printable Document Sheet - Direct A4 Canvas */}
      <div
        id="printable-contract"
        dir="ltr"
        className={`bg-white text-slate-900 mx-auto font-sans relative shadow-2xl print:shadow-none print:m-0 print:p-0 print:w-[210mm] print:h-[297mm] print:max-w-none overflow-hidden select-none w-full max-w-[794px] aspect-[794/1123] ${
          isPositioningMode ? 'ring-2 ring-blue-500/50 cursor-crosshair' : ''
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Background Image Layer */}
        {contract.backgroundImageUrl && (
          <img
            src={contract.backgroundImageUrl}
            alt="خلفية نموذج العقد"
            className="w-full h-full object-fill absolute inset-0 pointer-events-none select-none"
          />
        )}

        {/* Dynamic Text Fields Overlay SVG */}
        <svg
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 794 1123"
          dir="ltr"
          className={`w-full h-full absolute inset-0 block ${
            isPositioningMode ? 'cursor-crosshair' : 'pointer-events-none'
          }`}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Paper Canvas */}
          <rect width="794" height="1123" fill={contract.backgroundImageUrl ? 'transparent' : '#ffffff'} />

          {/* Text Elements */}
          <g
            fontFamily="'Traditional Arabic', 'Amiri', 'Segoe UI', 'Sakkal Majalla', serif, sans-serif"
            fontWeight="900"
            style={{ fontWeight: 900, textRendering: 'geometricPrecision' }}
          >
            {/* Helper renderer for draggable text elements with transparent highlight */}
            {[
              { key: 'contractNumber', val: contract.contractNumber || '', dir: 'ltr', fontSize: '14', width: 120 },
              { key: 'startDate', val: contract.startDate || '', dir: 'ltr', fontSize: '11.5', width: 110 },
              { key: 'startHijriDate', val: contract.startHijriDate || '', dir: 'rtl', fontSize: '11.5', width: 120 },
              { key: 'endDate', val: contract.endDate || '', dir: 'ltr', fontSize: '11.5', width: 110 },
              { key: 'endHijriDate', val: contract.endHijriDate || '', dir: 'rtl', fontSize: '11.5', width: 120 },
              { key: 'secondPartyName', val: contract.secondPartyName || '', dir: 'rtl', fontSize: '14', width: 220 },
              { key: 'secondPartyAddress', val: contract.secondPartyAddress || '', dir: 'rtl', fontSize: '13.5', width: 220 },
            ].map((item) => {
              const fieldKey = item.key as keyof ContractFieldPositions;
              const fieldPos = pos[fieldKey] || { x: 0, y: 0 };
              const isDragging = activeDraggingField === fieldKey;
              const boxWidth = item.width || 140;

              return (
                <g
                  key={fieldKey}
                  {...getPointerEvents(fieldKey)}
                  style={{
                    cursor: isPositioningMode ? (isDragging ? 'grabbing' : 'crosshair') : 'default',
                    touchAction: isPositioningMode ? 'none' : 'auto',
                    pointerEvents: isPositioningMode ? 'all' : 'none',
                  }}
                  className="select-none"
                >
                  {/* Transparent Highlight Box with dotted/solid blue border */}
                  {isPositioningMode && (
                    <rect
                      x={fieldPos.x - boxWidth / 2}
                      y={fieldPos.y - 15}
                      width={boxWidth}
                      height={22}
                      rx={4}
                      fill="transparent"
                      stroke={isDragging ? '#2563eb' : '#3b82f6'}
                      strokeWidth={isDragging ? 2 : 1.5}
                      strokeDasharray={isDragging ? 'none' : '3,3'}
                      opacity={isDragging ? 1 : 0.85}
                    />
                  )}

                  {/* Text Content - Always dark/black so background contract image is visible */}
                  <text
                    x={fieldPos.x}
                    y={fieldPos.y}
                    fontSize={item.fontSize}
                    fontWeight="900"
                    style={{ fontWeight: 900 }}
                    textAnchor="middle"
                    direction={item.dir as any}
                    unicodeBidi={item.dir === 'rtl' ? 'embed' : 'normal'}
                    fill="#000000"
                  >
                    {item.val}
                  </text>

                  {/* Drag Coordinate Tooltip on active hold */}
                  {isDragging && (
                    <g transform={`translate(${fieldPos.x}, ${fieldPos.y - 22})`}>
                      <rect
                        x="-45"
                        y="-16"
                        width="90"
                        height="18"
                        rx="4"
                        fill="#0f172a"
                        opacity="0.9"
                      />
                      <text
                        x="0"
                        y="-4"
                        fill="#ffffff"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="sans-serif"
                        fontWeight="bold"
                      >
                        {`X:${fieldPos.x} Y:${fieldPos.y}`}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Location Google Maps QR Code Overlay */}
        {contract.showLocationQr && contract.googleMapsUrl && (
          <div
            {...getPointerEvents('locationQr')}
            style={{
              position: 'absolute',
              left: `${(pos.locationQr.x / 794) * 100}%`,
              top: `${(pos.locationQr.y / 1123) * 100}%`,
              width: '11.5%',
              height: '8.1%',
              zIndex: 30,
              touchAction: isPositioningMode ? 'none' : 'auto',
              cursor: isPositioningMode ? (activeDraggingField === 'locationQr' ? 'grabbing' : 'crosshair') : 'default',
              pointerEvents: isPositioningMode ? 'all' : 'none',
            }}
            className={`flex items-center justify-center select-none transition-all ${
              isPositioningMode
                ? activeDraggingField === 'locationQr'
                  ? 'ring-2 ring-blue-600 bg-transparent rounded shadow-lg scale-105 z-50'
                  : 'ring-1 ring-blue-400/80 ring-dashed rounded bg-transparent'
                : 'bg-transparent'
            }`}
            title={isPositioningMode ? 'اضغط واسحب لتحريك كيو ار الخريطة' : undefined}
          >
            <QRCodeSVG
              value={contract.googleMapsUrl}
              size={90}
              level="M"
              fgColor="#000000"
              bgColor="transparent"
              className="w-full h-full pointer-events-none"
            />

            {/* Drag tooltip for QR code */}
            {activeDraggingField === 'locationQr' && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-lg whitespace-nowrap pointer-events-none">
                {`X:${pos.locationQr.x} Y:${pos.locationQr.y}`}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
