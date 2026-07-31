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

  // Background template image (uploaded image or default SVG with relative base URL)
  const getBgImageSrc = (url?: string) => {
    if (url && (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    const baseUrl = (import.meta as any).env?.BASE_URL || './';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    return `${cleanBase}contract_template.svg`;
  };

  const bgImageSrc = getBgImageSrc(contract.backgroundImageUrl);

  // Dragging event handlers convert screen coordinates into SVG coordinate space (794 x 1123)
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

      {/* Main Printable Document Sheet */}
      <div
        id="printable-contract"
        dir="ltr"
        className={`bg-white text-slate-900 mx-auto font-sans relative shadow-2xl print:shadow-none print:m-0 print:p-0 print:w-[210mm] print:h-[297mm] print:max-w-none overflow-hidden select-none w-full max-w-[794px] aspect-[794/1123] ${
          isPositioningMode ? 'ring-2 ring-blue-500/50' : ''
        }`}
        style={{ boxSizing: 'border-box' }}
      >
        {/* Dynamic Interactive Overlay SVG Layer for Text Fields and Template */}
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
          {/* Background Contract Template: User Custom Image OR Default Vector Sheet */}
          {contract.backgroundImageUrl ? (
            <image
              href={contract.backgroundImageUrl}
              x="0"
              y="0"
              width="794"
              height="1123"
              preserveAspectRatio="none"
            />
          ) : (
            <g id="default-contract-template-bg">
              {/* White Background Paper */}
              <rect width="794" height="1123" fill="#ffffff" />

              {/* Left Header (English - Red Maroon) */}
              <g fill="#800000" fontFamily="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">
                <text x="40" y="42" fontSize="13" fontWeight="800">Al Masa Alloys Corporation</text>
                <text x="40" y="60" fontSize="11" fontWeight="700">add/ Riyadh, Al Nour district</text>
                <text x="40" y="78" fontSize="11" fontWeight="700">vat : 310122348700003</text>
              </g>

              {/* Center Logo Graphic */}
              <g transform="translate(357, 16)">
                <polygon points="40,5 75,30 60,75 20,75 5,30" fill="#2b4c7e" />
                <polygon points="40,5 75,30 40,40" fill="#3b639e" />
                <polygon points="40,5 5,30 40,40" fill="#1e3559" />
                <polygon points="5,30 20,75 40,40" fill="#2b4c7e" />
                <polygon points="75,30 60,75 40,40" fill="#c07330" />
                <polygon points="20,75 60,75 40,40" fill="#1a2d4b" />
                <text x="40" y="90" textAnchor="middle" fontFamily="'Traditional Arabic', 'Amiri', 'Segoe UI', sans-serif" fontSize="15" fontWeight="900" fill="#000000">سبائك الماسة</text>
                <text x="40" y="100" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fontWeight="800" fill="#2b4c7e" letterSpacing="1">SABAIK ALMASA</text>
              </g>

              {/* Right Header (Arabic - Red Maroon) */}
              <g fill="#800000" fontFamily="'Traditional Arabic', 'Amiri', 'Segoe UI', sans-serif" direction="rtl" textAnchor="end">
                <text x="754" y="42" fontSize="14" fontWeight="800">مؤسسة سبائك الماسة</text>
                <text x="754" y="60" fontSize="11" fontWeight="700">العنوان : الرياض حي النور شارع الحصيبا</text>
                <text x="754" y="78" fontSize="11" fontWeight="700">الرقم الضريبي : 310122348700003</text>
              </g>

              {/* Service Agreement Title Bar (Blue) */}
              <rect x="40" y="132" width="714" height="28" fill="#5b859a"/>
              <text x="397" y="151" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="14.5" fontWeight="bold" fill="#ffffff">اتفاقية خدمة</text>

              {/* Preamble Static Text Labels */}
              <g fontFamily="'Segoe UI', Arial, sans-serif" fontSize="12" fontWeight="bold" fill="#000000" direction="rtl" textAnchor="end">
                <text x="754" y="190">بعون الله ابرم هذا العقد رقم</text>
                <text x="525" y="190">في تاريخ</text>
                <text x="395" y="190">الموافق</text>
                <text x="210" y="190">و ينتهي في تاريخ</text>

                <text x="754" y="214">الموافق</text>

                <text x="754" y="238">بين كل من :</text>

                <text x="754" y="262">1- مؤسسة سبائك الماسة للمقاولات سجل تجاري 1010893280 (طرف اول)</text>

                <text x="754" y="288">2-</text>

                <text x="754" y="314">العنوان :</text>

                <text x="754" y="342">اتفق الطرفان على الاتي :</text>
              </g>

              {/* Section 1: General Terms */}
              <rect x="40" y="362" width="714" height="26" fill="#5b859a"/>
              <text x="744" y="379" textAnchor="end" fontFamily="'Segoe UI', sans-serif" fontSize="13" fontWeight="bold" fill="#ffffff">أولاً:- البنود العامة</text>

              <g fontFamily="'Segoe UI', Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#000000" direction="rtl" textAnchor="end">
                <text x="754" y="404">1-   تم استلام الحاوية بواسطة المستأجر ويتم إخلاؤها بعد إنهاء العقد علماً بأنه أصبح مسئول عن الحاوية مسئولية كاملة وذلك خلال مدة سريان هذا العقد.</text>
                <text x="754" y="426">2-   يتحمل المستأجر قيمة الغرامات والمخالفات الصادرة من الجهات المختصة في حال عدم وضع النفايات داخل الحاوية أو في حالة استخدامها في غير</text>
                <text x="728" y="443">الغرض الذى خصصت له.</text>
                <text x="754" y="465">3-   يلتزم المستأجر بعدم إلقاء المخلفات الصلبة مثل الحديد والأخشاب والبلوك والرمل وخلافه وفي حال ذلك يتحمل المستأجر قيمة استبدال الحاوية بحاوية</text>
                <text x="728" y="482">أخرى.</text>
                <text x="754" y="504">4-   لا يحق للمستأجر فسخ العقد إلا بعد أخذ موافقة خطية من إدارة النظافة بالأمانة.</text>
                <text x="754" y="526">5-   يتعهد المستأجر بتوفير حيز مناسب للحاوية على أن يكون في نطاق الارتداد الخاص به.</text>
                <text x="754" y="548">6-   تم سداد 10% من قيمة ايجار الحاوية.</text>
              </g>

              {/* Section 2: Technical Offer */}
              <rect x="40" y="570" width="714" height="26" fill="#5b859a"/>
              <text x="744" y="587" textAnchor="end" fontFamily="'Segoe UI', sans-serif" fontSize="13" fontWeight="bold" fill="#ffffff">ثانياً:- العرض الفني</text>

              <g fontFamily="'Segoe UI', Arial, sans-serif" fontSize="11" fontWeight="bold" fill="#000000" direction="rtl" textAnchor="end">
                <text x="754" y="612">1-   نوع الخدمة : يقوم الطرف الأول بتقديم خدمة إزالة النفايات من موقع العميل.</text>
                <text x="754" y="634">2-   يلتزم الطرف الأول بتوفير حاوية نفايات حسب المقاس المتفق عليه بالعقد وتلتزم بتفريغ الحاوية في الاوقات المحددة كما ورد في قانون المرور بالرياض.</text>
              </g>

              {/* Service Table Frame */}
              <rect x="40" y="662" width="714" height="28" fill="#cd9158" stroke="#000000" strokeWidth="1.5"/>
              <rect x="40" y="690" width="714" height="32" fill="#ffffff" stroke="#000000" strokeWidth="1.5"/>
              <line x1="220" y1="662" x2="220" y2="722" stroke="#000000" strokeWidth="1.5"/>
              <line x1="600" y1="662" x2="600" y2="722" stroke="#000000" strokeWidth="1.5"/>

              <text x="130" y="681" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="12" fontWeight="bold" fill="#000000">العدد</text>
              <text x="410" y="681" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="12" fontWeight="bold" fill="#000000">وصف الخدمة</text>
              <text x="677" y="681" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="12" fontWeight="bold" fill="#000000">نوع الخدمة</text>

              {/* Notes Row Frame */}
              <rect x="40" y="730" width="714" height="28" fill="#ffffff" stroke="#000000" strokeWidth="1.5"/>
              <rect x="640" y="730" width="114" height="28" fill="#cd9158" stroke="#000000" strokeWidth="1.5"/>
              <text x="697" y="749" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="12" fontWeight="bold" fill="#000000">الملاحظات</text>

              {/* Signatures & Seal */}
              <text x="220" y="800" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="13" fontWeight="bold" fill="#000000">الطرف الثاني</text>
              <text x="570" y="800" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="13" fontWeight="bold" fill="#000000">الطرف الأول</text>

              {/* First Party Oval Stamp Seal */}
              <g transform="translate(512, 810)">
                <ellipse cx="60" cy="32" rx="55" ry="26" fill="none" stroke="#1b365d" strokeWidth="2" strokeDasharray="4 2"/>
                <ellipse cx="60" cy="32" rx="50" ry="22" fill="none" stroke="#1b365d" strokeWidth="1.5"/>
                <text x="60" y="24" textAnchor="middle" fontFamily="sans-serif" fontSize="7.5" fontWeight="900" fill="#1b365d">مؤسسة سبائك الماسة للمقاولات</text>
                <text x="60" y="34" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="#1b365d">قسم الحاويات</text>
                <text x="60" y="42" textAnchor="middle" fontFamily="sans-serif" fontSize="6.5" fontWeight="bold" fill="#1b365d">س.ت: 1010893280</text>
                <text x="60" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="5.5" fontWeight="bold" fill="#1b365d">SABAIK ALMASAH CONTRACTING EST.</text>
              </g>

              {/* Footer Section */}
              <g fill="#800000" fontFamily="'Segoe UI', sans-serif" fontSize="10.5" fontWeight="bold">
                <text x="754" y="1035" textAnchor="end">العنوان : الرياض حي النور شارع الحصيبا</text>
                <text x="40" y="1035" textAnchor="start">0555888767 : رقم الهاتف</text>
                <text x="754" y="1053" textAnchor="end">السجل التجاري : 1010893280</text>
                <text x="40" y="1053" textAnchor="start">14813 : الرمز البريدي</text>
              </g>

              {/* Bottom Blue Strip */}
              <rect x="40" y="1066" width="714" height="22" fill="#5b859a"/>
              <text x="397" y="1081" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize="11" fontWeight="bold" fill="#ffffff">صفحة 1 من 1</text>
            </g>
          )}
          {/* Dynamic Contract Preamble Text Fields in Extra-Bold Font Matching Template */}
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

            {/* Start Hijri Date (Numbers only format right-to-left) */}
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

            {/* End Hijri Date (Numbers only format right-to-left) */}
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

            {/* Second Party (Client Name) - Bold */}
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

            {/* Second Party Address - Bold */}
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

        {/* Location Google Maps QR Code Overlay (Clean HTML Div to avoid foreignObject html2canvas freeze) */}
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
