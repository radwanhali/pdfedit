export interface FieldPosition {
  x: number;
  y: number;
}

export interface ContractFieldPositions {
  contractNumber: FieldPosition;
  startDate: FieldPosition;
  startHijriDate: FieldPosition;
  endDate: FieldPosition;
  endHijriDate: FieldPosition;
  secondPartyName: FieldPosition;
  secondPartyAddress: FieldPosition;
  locationQr: FieldPosition;
}

export interface ContractData {
  id: string;
  contractNumber: string; // رقم العقد
  startDate: string; // في تاريخ (مثال: 2026-08-01)
  startHijriDate: string; // الموافق (مثال: 1448/02/17)
  endDate: string; // وينتهي في تاريخ (مثال: 2026-08-31)
  endHijriDate: string; // الموافق (مثال: 1448/03/17)
  
  // الطرف الأول (الشركة)
  firstPartyName: string; // مؤسسة سبائك الماسة للمقاولات
  firstPartyCr: string; // 1010893280
  
  // الطرف الثاني (العميل)
  secondPartyName: string; // اسم أو مؤسسة الطرف الثاني
  secondPartyAddress: string; // العنوان
  
  // موقع جوجل ماب و QR Code
  googleMapsUrl: string; // رابط موقع جوجل ماب
  showLocationQr: boolean; // إظهار كيو ار الخريطة
  
  // خلفية الصورة والتصميم المطبوع
  useBackgroundImage?: boolean; // استخدام صورة النموذج كخلفية
  backgroundImageUrl?: string; // رابط أو صورة الخلفية المخصصة
  
  // إحداثيات ومواقع الحقول التفاعلية
  fieldPositions?: Partial<ContractFieldPositions>;
  
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ آخر تعديل
  status: 'draft' | 'active' | 'expired' | 'cancelled'; // حالة العقد
}
