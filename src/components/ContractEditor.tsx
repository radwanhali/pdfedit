import React from 'react';
import { ContractData, ContractFieldPositions } from '../types';
import { convertToHijriText, DEFAULT_FIELD_POSITIONS } from '../utils/contractDefaults';
import {
  Calendar,
  MapPin,
  User,
  RefreshCw,
  Move,
  RotateCcw,
  FileText,
  Image,
  Upload,
  Trash2,
  Sliders,
  FolderOpen,
  Eye,
} from 'lucide-react';
import { ContractList } from './ContractList';

export type EditorTab = 'data' | 'background' | 'positions' | 'contracts';

interface ContractEditorProps {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  contract: ContractData;
  onChange: (updated: ContractData) => void;
  onOpenPreviewModal: () => void;
  isPositioningMode?: boolean;
  onTogglePositioningMode?: () => void;
  // Props for Contracts List Tab
  contracts: ContractData[];
  selectedContractId: string;
  onSelectContract: (id: string) => void;
  onCreateNewContract: () => void;
  onDeleteContract: (id: string) => void;
  onImportContracts: (imported: ContractData[]) => void;
  onPreviewContract: (id: string) => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({
  activeTab,
  setActiveTab,
  contract,
  onChange,
  onOpenPreviewModal,
  isPositioningMode = false,
  onTogglePositioningMode,
  contracts,
  selectedContractId,
  onSelectContract,
  onCreateNewContract,
  onDeleteContract,
  onImportContracts,
  onPreviewContract,
}) => {
  const updateField = <K extends keyof ContractData>(key: K, value: ContractData[K]) => {
    onChange({
      ...contract,
      [key]: value,
      updatedAt: new Date().toISOString(),
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
      updatedAt: new Date().toISOString(),
    });
  };

  const handleEndDateChange = (val: string) => {
    const autoHijri = convertToHijriText(val);
    onChange({
      ...contract,
      endDate: val,
      endHijriDate: autoHijri || contract.endHijriDate,
      updatedAt: new Date().toISOString(),
    });
  };

  const positions: ContractFieldPositions = {
    ...DEFAULT_FIELD_POSITIONS,
    ...(contract.fieldPositions || {}),
  };

  const updateSinglePosition = (
    fieldKey: keyof ContractFieldPositions,
    coord: 'x' | 'y',
    val: number
  ) => {
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
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden text-right flex flex-col" dir="rtl">
      {/* Navigation Tabs Header */}
      <div className="bg-slate-100/90 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'data'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80 ring-1 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
          <span>قسم بيانات العقد المدمجة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('background')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'background'
              ? 'bg-white text-purple-700 shadow-xs border border-slate-200/80 ring-1 ring-purple-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Image className="w-4 h-4 text-purple-600 shrink-0" />
          <span>قسم خلفية العقد</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('positions')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'positions'
              ? 'bg-white text-amber-800 shadow-xs border border-slate-200/80 ring-1 ring-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-600 shrink-0" />
          <span>ضبط مواضع الحقول</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contracts')}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'contracts'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80 ring-1 ring-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>قسم العقود ({contracts.length})</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="p-4 sm:p-6 space-y-6 flex-1">
        {/* TAB 1: قسم بيانات العقد المدمجة */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  بيانات العقد المدمجة
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  إدخال رقم العقد والتواريخ المزدوجة وبيانات العجل ورابط الخريطة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  عقد #{contract.contractNumber || 'جديد'}
                </span>

                <button
                  type="button"
                  onClick={onOpenPreviewModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>عرض العقد</span>
                </button>
              </div>
            </div>

            {/* Section 1: Contract Number & Dates */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100/80 p-2.5 rounded-lg border border-slate-200">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>رقم العقد وتواريخ البداية والنهاية</span>
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
                        تاريخ بداية العقد (هجري - أرقام)
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
                        تاريخ نهاية العقد (هجري - أرقام)
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
                <span>بيانات الطرف الثاني (العميل)</span>
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
                    العنوان التفصيلي للعميل <span className="text-red-500">*</span>
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
                  <span>موقع الخريطة (Google Maps QR Code)</span>
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
          </div>
        )}

        {/* TAB 2: قسم خلفية العقد */}
        {activeTab === 'background' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Image className="w-4 h-4 text-purple-600" />
                  قسم خلفية العقد (صورة أو نموذج العقد المطبوع)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  يمكنك رفع صورة الورقة المتروسة أو استخدام القالب الافتراضي الجاهز
                </p>
              </div>

              <span className="text-xs px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200">
                {contract.backgroundImageUrl ? 'نموذج مطبوع محدد' : 'ورقة بيضاء'}
              </span>
            </div>

            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4">
              <div className="text-xs text-purple-900 leading-relaxed font-medium">
                اختر صورة النموذج المطبوع المعتمد لشركتك، وسيتم إسقاط الحقول والنصوص بالمليمترات فوق مواضعها المناسبة.
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-xs">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة نموذج العقد (PNG / JPG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => updateField('backgroundImageUrl', '/contract_template.svg')}
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-2xs"
                >
                  <Image className="w-4 h-4 text-blue-600" />
                  <span>استخدام القالب الافتراضي النظامي</span>
                </button>

                {contract.backgroundImageUrl && (
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>إزالة الخلفية (طباعة على ورقة بيضاء)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Preview Thumbnail */}
            {contract.backgroundImageUrl ? (
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">معاينة صورة القالب المحددة:</div>
                <div className="max-h-60 overflow-hidden rounded-lg border border-slate-300 flex justify-center bg-white">
                  <img
                    src={contract.backgroundImageUrl}
                    alt="نموذج العقد"
                    className="object-contain max-h-60 w-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                لا توجد صورة خلفية محددة حالياً - سيتم استخراج العقد خلفية بيضاء.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: قسم ضبط موضع الحقول */}
        {activeTab === 'positions' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-600" />
                  قسم ضبط موضع الحقول على صورة العقد
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  الضبط الدقيق لمواقع النصوص والإحداثيات بالمليمترات أو السحب المباشر في المعاينة
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenPreviewModal}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Move className="w-4 h-4" />
                  <span>فتح المعاينة المنبثقة والسحب</span>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('fieldPositions', DEFAULT_FIELD_POSITIONS)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  افتراضي
                </button>
              </div>
            </div>

            {/* Guidance banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-center justify-between gap-3">
              <span>
                يمكنك الضغط على زر <strong>"فتح المعاينة المنبثقة"</strong> للتحريك السريع بالماوس، أو تعديل إحداثيات X و Y يدوياً أدناه:
              </span>
            </div>

            {/* Coordinates grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                  <div key={k} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs">
                    <span className="font-bold text-slate-800 shrink-0">{field.label}:</span>
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
        )}

        {/* TAB 4: قسم العقود */}
        {activeTab === 'contracts' && (
          <div className="animate-in fade-in duration-150">
            <ContractList
              contracts={contracts}
              selectedContractId={selectedContractId}
              onSelectContract={onSelectContract}
              onEditContract={(id) => {
                onSelectContract(id);
                setActiveTab('data');
              }}
              onPreviewContract={(id) => {
                onSelectContract(id);
                onPreviewContract(id);
              }}
              onCreateNewContract={() => {
                onCreateNewContract();
                setActiveTab('data');
              }}
              onDeleteContract={onDeleteContract}
              onImportContracts={onImportContracts}
            />
          </div>
        )}
      </div>
    </div>
  );
};
