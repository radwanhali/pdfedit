import React from 'react';
import { ContractData, ContractFieldPositions } from '../types';
import { convertToHijriText, DEFAULT_FIELD_POSITIONS } from '../utils/contractDefaults';
import { Calendar, MapPin, User, RefreshCw, Move, RotateCcw, FileText, Image, Upload, Trash2 } from 'lucide-react';

interface ContractEditorProps {
  contract: ContractData;
  onChange: (updated: ContractData) => void;
  isPositioningMode?: boolean;
  onTogglePositioningMode?: () => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  contract,
  onChange,
  isPositioningMode = false,
  onTogglePositioningMode,
}) => {
  const updateField = <K extends keyof ContractData>(key: K, value: ContractData[K]) => {
    onChange({
      ...contract,
      [key]: value,
      updatedAt: new Date().toISOString()
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onChange({
          ...contract,
          useBackgroundImage: true,
          backgroundImageUrl: result,
          updatedAt: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetImage = () => {
    onChange({
      ...contract,
      useBackgroundImage: true,
      backgroundImageUrl: undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleStartDateChange = (val: string) => {
    const autoHijri = convertToHijriText(val);
    onChange({
      ...contract,
      startDate: val,
      startHijriDate: autoHijri || contract.startHijriDate,
      updatedAt: new Date().toISOString()
    });
  };


  const handleEndDateChange = (val: string) => {
    const autoHijri = convertToHijriText(val);
    onChange({
      ...contract,
      endDate: val,
      endHijriDate: autoHijri || contract.endHijriDate,
      updatedAt: new Date().toISOString()
    });
  };

  const positions: ContractFieldPositions = {
    ...DEFAULT_FIELD_POSITIONS,
    ...(contract.fieldPositions || {}),
  };

  const updateSinglePosition = (fieldKey: keyof ContractFieldPositions, coord: 'x' | 'y', val: number) => {
    const updatedPositions: ContractFieldPositions = {
      ...positions,
      [fieldKey]: {
        ...positions[fieldKey],
        [coord]: val,
      },
    };
    updateField('fieldPositions', updatedPositions);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-right space-y-6 p-5 sm:p-6" dir="rtl">
      {/* Unified Editor Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          بيانات العقد المدمجة
        </h3>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
          عقد رقم #{contract.contractNumber || 'جديد'}
        </span>
      </div>

      {/* Section 1: Contract Number & Dates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>1. رقم العقد وتواريخ البداية والنهاية</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              رقم العقد <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contract.contractNumber}
              onChange={(e) => updateField('contractNumber', e.target.value)}
              placeholder="مثال: 1001"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-4">
            {/* Start Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  تاريخ بداية العقد (ميلادي)
                </label>
                <input
                  type="date"
                  value={contract.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  تاريخ بداية العقد (هجري - أرقام فقط)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contract.startHijriDate}
                    onChange={(e) => updateField('startHijriDate', e.target.value)}
                    placeholder="مثال: 1448/02/17"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('startHijriDate', convertToHijriText(contract.startDate))}
                    title="توليد تلقائي للهجري أرقام"
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  تاريخ نهاية العقد (ميلادي)
                </label>
                <input
                  type="date"
                  value={contract.endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  تاريخ نهاية العقد (هجري - أرقام فقط)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contract.endHijriDate}
                    onChange={(e) => updateField('endHijriDate', e.target.value)}
                    placeholder="مثال: 1448/03/17"
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateField('endHijriDate', convertToHijriText(contract.endDate))}
                    title="توليد تلقائي للهجري أرقام"
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Second Party (Client) */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200">
          <User className="w-4 h-4 text-blue-600" />
          <span>2. بيانات الطرف الثاني (العميل)</span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم أو شركة الطرف الثاني <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contract.secondPartyName}
              onChange={(e) => updateField('secondPartyName', e.target.value)}
              placeholder="مثال: شركة المقاولات الحديثة المحدودة"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              العنوان التفصيلي <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contract.secondPartyAddress}
              onChange={(e) => updateField('secondPartyAddress', e.target.value)}
              placeholder="مثال: الرياض - حي الملز - شارع الستين"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Google Maps Location & QR Code */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between bg-slate-100/80 p-2.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span>3. موقع الخريطة (Google Maps QR Code)</span>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800 cursor-pointer bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <input
              type="checkbox"
              checked={contract.showLocationQr}
              onChange={(e) => updateField('showLocationQr', e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            إظهار كيو ار الخريطة
          </label>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            رابط موقع خرائط جوجل (Google Maps Link)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={contract.googleMapsUrl}
              onChange={(e) => updateField('googleMapsUrl', e.target.value)}
              placeholder="https://maps.google.com/?q=24.7136,46.6753"
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
              dir="ltr"
            />
            {contract.googleMapsUrl && (
              <a
                href={contract.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1 shrink-0"
              >
                تجربة الرابط
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Position Fine-Tuning */}
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <Move className="w-4 h-4 text-amber-600" />
            <span>4. ضبط مواضع الحقول على صورة العقد</span>
          </div>


          <div className="flex items-center gap-2">
            {onTogglePositioningMode && (
              <button
                type="button"
                onClick={onTogglePositioningMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isPositioningMode
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                {isPositioningMode ? 'تفعيل السحب (نشط الآن)' : 'تفعيل السحب بالماوس'}
              </button>
            )}

            <button
              type="button"
              onClick={() => updateField('fieldPositions', DEFAULT_FIELD_POSITIONS)}
              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { key: 'contractNumber', label: 'رقم العقد' },
            { key: 'startDate', label: 'تاريخ البداية (ميلادي)' },
            { key: 'startHijriDate', label: 'تاريخ البداية (هجري)' },
            { key: 'endDate', label: 'تاريخ النهاية (ميلادي)' },
            { key: 'endHijriDate', label: 'تاريخ النهاية (هجري)' },
            { key: 'secondPartyName', label: 'اسم الطرف الثاني' },
            { key: 'secondPartyAddress', label: 'عنوان الطرف الثاني' },
            { key: 'locationQr', label: 'موقع QR الخريطة' },
          ].map((field) => {
            const k = field.key as keyof ContractFieldPositions;
            const pos = positions[k] || { x: 0, y: 0 };
            return (
              <div key={k} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700 shrink-0">{field.label}:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">X:</span>
                    <input
                      type="number"
                      value={pos.x}
                      onChange={(e) => updateSinglePosition(k, 'x', Number(e.target.value))}
                      className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-mono">Y:</span>
                    <input
                      type="number"
                      value={pos.y}
                      onChange={(e) => updateSinglePosition(k, 'y', Number(e.target.value))}
                      className="w-16 p-1 text-center bg-white border border-slate-200 rounded font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
