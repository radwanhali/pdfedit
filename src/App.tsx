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
import { ContractEditor, EditorTab } from './components/ContractEditor';
import { ContractPreviewModal } from './components/ContractPreviewModal';
import { ContractDocument } from './components/ContractDocument';
import { CheckCircle } from 'lucide-react';

export default function App() {
  const [contracts, setContracts] = useState<ContractData[]>(() => loadContractsFromStorage());
  const [selectedContractId, setSelectedContractId] = useState<string>(() => {
    const list = loadContractsFromStorage();
    return list[0]?.id || INITIAL_CONTRACT.id;
  });

  const [activeTab, setActiveTab] = useState<EditorTab>('data');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isPositioningMode, setIsPositioningMode] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
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
    setActiveTab('data'); // Automatically switch to Merged Contract Data tab
    showToast(`تم إنشاء عقد جديد رقم #${nextNum} وفتح بيانات الإدخال`);
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
    showToast('تم استيراد جميع العقود بنجاح');
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    showToast('جاري استخراج وتحميل ملف الـ PDF مباشرة...');

    try {
      const filename = `اتفاقية_خدمة_عقد_${activeContract.contractNumber || 'جديد'}.pdf`;
      await exportToPdf('printable-contract', filename);
      showToast('تم تحميل ملف الـ PDF بنجاح!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('حدث خطأ أثناء استخراج PDF، يرجى المحاولة مرة أخرى');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    printDocument();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-right text-slate-800" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 text-xs font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        contractNumber={activeContract.contractNumber}
        isSaved={isSaved}
        onPrint={handlePrint}
        onExportPdf={handleExportPdf}
        isExportingPdf={isExportingPdf}
        onCreateNew={handleCreateNewContract}
        onSave={handleSaveContract}
        onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <ContractEditor
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          contract={activeContract}
          onChange={handleContractChange}
          onOpenPreviewModal={() => setIsPreviewModalOpen(true)}
          isPositioningMode={isPositioningMode}
          onTogglePositioningMode={() => setIsPositioningMode(!isPositioningMode)}
          contracts={contracts}
          selectedContractId={selectedContractId}
          onSelectContract={(id) => setSelectedContractId(id)}
          onCreateNewContract={handleCreateNewContract}
          onDeleteContract={handleDeleteContract}
          onImportContracts={handleImportContracts}
          onPreviewContract={(id) => {
            setSelectedContractId(id);
            setIsPreviewModalOpen(true);
          }}
        />
      </main>

      {/* Full-Screen Pop-up Preview Modal */}
      <ContractPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        contract={activeContract}
        isPositioningMode={isPositioningMode}
        onTogglePositioningMode={() => setIsPositioningMode(!isPositioningMode)}
        onPositionsChange={handlePositionsChange}
      />

      {/* Hidden Container for PDF Export & Browser Printing */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-0" aria-hidden="true">
        <div id="printable-contract" className="w-[794px]">
          <ContractDocument
            contract={activeContract}
            isPositioningMode={false}
          />
        </div>
      </div>
    </div>
  );
}
