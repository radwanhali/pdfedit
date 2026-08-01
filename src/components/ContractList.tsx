import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ContractData } from '../types';
import { Plus, Search, FileEdit, Trash2, Download, Upload, Clock, AlertCircle, Eye } from 'lucide-react';

interface ContractListProps {
  contracts: ContractData[];
  selectedContractId: string;
  onSelectContract: (id: string) => void;
  onEditContract?: (id: string) => void;
  onPreviewContract?: (id: string) => void;
  onCreateNewContract: () => void;
  onDeleteContract: (id: string) => void;
  onImportContracts: (imported: ContractData[]) => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  selectedContractId,
  onSelectContract,
  onEditContract,
  onPreviewContract,
  onCreateNewContract,
  onDeleteContract,
  onImportContracts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contractToDelete, setContractToDelete] = useState<ContractData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredContracts = contracts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.contractNumber.toLowerCase().includes(q) ||
      c.secondPartyName.toLowerCase().includes(q) ||
      c.secondPartyAddress.toLowerCase().includes(q)
    );
  });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(contracts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `عقود_سبائك_الماسة_تنسيق_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportContracts(parsed);
        } else {
          setErrorMessage('ملف JSON غير صالح.');
        }
      } catch (err) {
        setErrorMessage('خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
  };

  const handleEditClick = (id: string) => {
    onSelectContract(id);
    if (onEditContract) {
      onEditContract(id);
    }
  };

  const handleDeleteClick = (c: ContractData) => {
    if (contracts.length <= 1) {
      setErrorMessage('لا يمكن حذف العقد الوحيد في القائمة.');
      return;
    }
    setContractToDelete(c);
  };

  const confirmDelete = () => {
    if (contractToDelete) {
      onDeleteContract(contractToDelete.id);
      setContractToDelete(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-full text-right relative" dir="rtl">
      {/* Delete Confirmation Modal */}
      {contractToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3 text-red-600 font-bold text-sm">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Trash2 className="w-5 h-5 shrink-0" />
                </div>
                <span>تأكيد حذف العقد</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                هل أنت متاكد من إرادتك لحذف العقد رقم <strong className="text-slate-900">#{contractToDelete.contractNumber}</strong> للعميل ({contractToDelete.secondPartyName || 'بدون اسم'})؟
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContractToDelete(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Error / Warning Alert Modal */}
      {errorMessage &&
        createPortal(
          <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>تنبيه</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg"
                >
                  موافق
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">العقود المحفوظة</h2>
          <p className="text-[11px] text-slate-500 font-medium">إجمالي العقود: {contracts.length}</p>
        </div>

        <button
          onClick={onCreateNewContract}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3 py-1.5 rounded-md transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          عقد جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم العقد أو اسم العميل..."
            className="w-full pl-3 pr-9 py-1.5 border border-slate-200 rounded-md text-xs bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2" />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="text-[10px]">حفظ تلقائي</span>
          <div className="flex gap-2">
            <button
              onClick={handleExportJson}
              title="تصدير النسخة الاحتياطية"
              className="flex items-center gap-0.5 text-blue-600 hover:underline font-medium text-[11px]"
            >
              <Download className="w-3 h-3" /> تصدير
            </button>
            <label className="flex items-center gap-0.5 text-blue-600 hover:underline font-medium text-[11px] cursor-pointer">
              <Upload className="w-3 h-3" /> استيراد
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px] flex-1">
        {filteredContracts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            لا توجد عقود مطابقة للبحث.
          </div>
        ) : (
          filteredContracts.map((c) => {
            const isSelected = c.id === selectedContractId;
            return (
              <div
                key={c.id}
                onClick={() => handleEditClick(c.id)}
                className={`p-3 transition-colors cursor-pointer flex items-center justify-between group ${
                  isSelected
                    ? 'bg-blue-50/70 border-r-3 border-blue-600'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded text-[11px]">
                      عقد #{c.contractNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {c.startDate}
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-800 line-clamp-1">
                    {c.secondPartyName || 'بدون اسم عميل'}
                  </div>

                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {c.secondPartyAddress || 'بدون عنوان'}
                  </div>
                </div>

                {/* Actions: Preview, Edit & Delete */}
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  {onPreviewContract && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectContract(c.id);
                        onPreviewContract(c.id);
                      }}
                      title="معاينة العقد بشكله النهائي"
                      className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold border border-emerald-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>معاينة</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(c.id);
                    }}
                    title="تحرير العقد"
                    className="p-1.5 text-blue-600 hover:bg-blue-100/60 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>تحرير</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(c);
                    }}
                    title="حذف العقد"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
