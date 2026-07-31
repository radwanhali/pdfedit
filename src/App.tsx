import React, { useState, useEffect } from 'react';
import { ContractData, ContractFieldPositions } from './types';
import {
  loadContractsFromStorage,
  saveContractsToStorage,
  INITIAL_CONTRACT,
  getTodayGregorian,
  getFutureGregorian,
  convertToHijriText,
} from './utils/contractDefaults';
import { exportToPdf, printDocument } from './utils/pdfExport';
import { Header } from './components/Header';
import { ContractEditor } from './components/ContractEditor';
import { ContractDocument } from './components/ContractDocument';
import { ContractList } from './components/ContractList';
import { Save, CheckCircle, Printer, Download, Sparkles, Move } from 'lucide-react';

export default function App() {
  const [contracts, setContracts] = useState<ContractData[]>(() => loadContractsFromStorage());
  const [selectedContractId, setSelectedContractId] = useState<string>(() => {
    const list = loadContractsFromStorage();
    return list[0]?.id || INITIAL_CONTRACT.id;
  });

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isPositioningMode, setIsPositioningMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Get active contract
  const activeContract = contracts.find((c) => c.id === selectedContractId) || contracts[0] || INITIAL_CONTRACT;

  // Sync to localStorage whenever contracts state changes
  useEffect(() => {
    saveContractsToStorage(contracts);
  }, [contracts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleContractChange = (updated: ContractData) => {
    setContracts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setIsSaved(false);
  };

  const handlePositionsChange = (newPositions: ContractFieldPositions) => {
    handleContractChange({
      ...activeContract,
      fieldPositions: newPositions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveContract = () => {
    saveContractsToStorage(contracts);
    setIsSaved(true);
    showToast(`تم حفظ العقد رقم #${activeContract.contractNumber} بنجاح!`);
  };

  const handleCreateNewContract = () => {
    const nextNum = (contracts.length + 1001).toString();
    const today = getTodayGregorian();
    const future = getFutureGregorian(30);

    const newContract: ContractData = {
      ...INITIAL_CONTRACT,
      id: `contract-${Date.now()}`,
      contractNumber: nextNum,
      startDate: today,
      startHijriDate: convertToHijriText(today),
      endDate: future,
      endHijriDate: convertToHijriText(future),
      secondPartyName: '',
      secondPartyAddress: '',
      useBackgroundImage: activeContract.useBackgroundImage ?? true,
      backgroundImageUrl: activeContract.backgroundImageUrl || INITIAL_CONTRACT.backgroundImageUrl,
      fieldPositions: activeContract.fieldPositions
        ? { ...activeContract.fieldPositions }
        : { ...INITIAL_CONTRACT.fieldPositions },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setContracts((prev) => [newContract, ...prev]);
    setSelectedContractId(newContract.id);
    setIsSaved(true);
    if (viewMode === 'preview') {
      setViewMode('split');
    }
    showToast(`تم إنشاء عقد جديد رقم #${nextNum}`);
  };

  const handleDeleteContract = (id: string) => {
    const filtered = contracts.filter((c) => c.id !== id);
    setContracts(filtered);
    if (selectedContractId === id) {
      setSelectedContractId(filtered[0]?.id || '');
    }
    showToast('تم حذف العقد بنجاح');
  };

  const handleImportContracts = (importedList: ContractData[]) => {
    setContracts(importedList);
    if (importedList.length > 0) {
      setSelectedContractId(importedList[0].id);
    }
    showToast('تم استيراد قائمة العقود بنجاح');
  };

  const handleExportPdf = () => {
    const filename = `اتفاقية_خدمة_عقد_${activeContract.contractNumber || 'جديد'}.pdf`;
    exportToPdf('printable-contract', filename);
    showToast('جاري تجهيز وتحميل ملف الـ PDF...');
  };

  const handlePrint = () => {
    printDocument();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-right text-slate-800" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 border border-slate-700 text-xs font-medium animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Header
        contractNumber={activeContract.contractNumber}
        isSaved={isSaved}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        onCreateNew={handleCreateNewContract}
        onSave={handleSaveContract}
        showSidebar={showSidebar}
        toggleSidebar={() => setShowSidebar(!showSidebar)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Saved Contracts Sidebar */}
        {showSidebar && (
          <aside className="lg:col-span-3 space-y-4 sticky top-20 print:hidden">
            <ContractList
              contracts={contracts}
              selectedContractId={selectedContractId}
              onSelectContract={(id) => setSelectedContractId(id)}
              onEditContract={(id) => {
                setSelectedContractId(id);
                if (viewMode === 'preview') {
                  setViewMode('split');
                }
              }}
              onCreateNewContract={handleCreateNewContract}
              onDeleteContract={handleDeleteContract}
              onImportContracts={handleImportContracts}
            />
          </aside>
        )}

        {/* Editor and/or A4 Preview Area */}
        <section
          className={`${
            showSidebar ? 'lg:col-span-9' : 'lg:col-span-12'
          } grid grid-cols-1 ${
            viewMode === 'split' ? 'xl:grid-cols-2' : ''
          } gap-6`}
        >
          {/* Editor Column */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className="space-y-4 print:hidden">
              <div className="bg-white border border-slate-200 text-slate-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    محرر بيانات العقد
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    تعبئة التواريخ والعميل وخرائط Google وتحريك مواضع الحقول.
                  </p>
                </div>

                <button
                  onClick={handleSaveContract}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-md flex items-center gap-1 transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  حفظ العقد
                </button>
              </div>

              <ContractEditor
                contract={activeContract}
                onChange={handleContractChange}
                isPositioningMode={isPositioningMode}
                onTogglePositioningMode={() => setIsPositioningMode(!isPositioningMode)}
              />
            </div>
          )}

          {/* A4 Live Document Preview Column */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className="space-y-4 flex flex-col items-center">
              {/* Preview Status Banner */}
              <div className="w-full bg-white border border-slate-200 text-slate-800 p-3 rounded-xl flex items-center justify-between text-xs font-medium print:hidden shadow-xs">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span className="text-slate-700 font-semibold">المعاينة الطباعية المباشرة (A4)</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Field positioning toggle button */}
                  <button
                    onClick={() => setIsPositioningMode(!isPositioningMode)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 font-semibold ${
                      isPositioningMode
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                    }`}
                    title="تفعيل سحب وتحريك مواضع الحقول بالماوس"
                  >
                    <Move className="w-3 h-3" />
                    {isPositioningMode ? 'إيقاف التحريك' : 'تحريك الحقول'}
                  </button>

                  <button
                    onClick={handleExportPdf}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    تصدير PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 rounded-md text-xs transition-colors flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3 text-slate-500" />
                    طباعة
                  </button>
                </div>
              </div>

              {/* Document Display Container with responsive scaling */}
              <div className="w-full p-2 sm:p-4 bg-slate-200/50 rounded-xl border border-slate-200 flex justify-center items-center overflow-hidden">
                <div className="w-full max-w-[794px]">
                  <ContractDocument
                    contract={activeContract}
                    isPositioningMode={isPositioningMode}
                    onPositionChange={handlePositionsChange}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
