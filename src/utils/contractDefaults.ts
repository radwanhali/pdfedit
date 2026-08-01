import { ContractData, ContractFieldPositions } from '../types';

export function getTodayGregorian(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

export function getFutureGregorian(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Converts a Gregorian YYYY-MM-DD date string into an Arabic Hijri DD/MM/YYYY format
 * Starting with Day, then Month, then Year (e.g. 17/02/1448)
 */
export function convertToHijriText(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-nu-latn', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(d);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;

    if (year && month && day) {
      const dFormatted = day.padStart(2, '0');
      const mFormatted = month.padStart(2, '0');
      // Format as Day/Month/Year (DD/MM/YYYY)
      return `${dFormatted}/${mFormatted}/${year}`;
    }

    return formatter.format(d);
  } catch (e) {
    return '';
  }
}

export const DEFAULT_FIELD_POSITIONS: ContractFieldPositions = {
  contractNumber: { x: 585, y: 190 },
  startDate: { x: 458, y: 190 },
  startHijriDate: { x: 300, y: 190 },
  endDate: { x: 115, y: 190 },
  endHijriDate: { x: 690, y: 214 },
  secondPartyName: { x: 735, y: 288 },
  secondPartyAddress: { x: 680, y: 314 },
  locationQr: { x: 125, y: 170 },
};

export const INITIAL_CONTRACT: ContractData = {
  id: 'contract-1001',
  contractNumber: '1001',
  startDate: getTodayGregorian(),
  startHijriDate: convertToHijriText(getTodayGregorian()),
  endDate: getFutureGregorian(30),
  endHijriDate: convertToHijriText(getFutureGregorian(30)),

  firstPartyName: 'مؤسسة سبائك الماسة للمقاولات',
  firstPartyCr: '1010893280',

  secondPartyName: 'شركة المقاولات الحديثة المحدودة',
  secondPartyAddress: 'الرياض - حي الملز - شارع الستين',

  googleMapsUrl: 'https://maps.google.com/?q=24.7136,46.6753',
  showLocationQr: true,

  fieldPositions: { ...DEFAULT_FIELD_POSITIONS },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'active',
};

export const LOCAL_STORAGE_KEY = 'sabaik_almasa_contracts';
export const SHARED_BG_IMAGE_KEY = 'sabaik_almasa_shared_bg';

export function loadContractsFromStorage(): ContractData[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const sharedBg = localStorage.getItem(SHARED_BG_IMAGE_KEY) || undefined;

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: ContractData) => ({
          ...c,
          backgroundImageUrl: c.backgroundImageUrl || sharedBg,
        }));
      }
    }
  } catch (e) {
    console.error('Failed to load contracts from localStorage', e);
  }
  return [INITIAL_CONTRACT];
}

export function saveContractsToStorage(contracts: ContractData[]) {
  try {
    let sharedBg: string | undefined = undefined;
    for (const c of contracts) {
      if (c.backgroundImageUrl && c.backgroundImageUrl.startsWith('data:image/')) {
        sharedBg = c.backgroundImageUrl;
        break;
      }
    }

    if (sharedBg) {
      try {
        localStorage.setItem(SHARED_BG_IMAGE_KEY, sharedBg);
      } catch (err) {
        console.warn('Could not store shared background image in localStorage quota', err);
      }
    }

    const sanitized = contracts.map((c) => {
      const copy = { ...c };
      if (copy.backgroundImageUrl && copy.backgroundImageUrl.startsWith('data:image/')) {
        delete copy.backgroundImageUrl;
      }
      return copy;
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('Quota exceeded in localStorage save attempt, attempting fallback optimization', e);
    try {
      const lightweight = contracts.map(({ id, contractNumber, startDate, startHijriDate, endDate, endHijriDate, secondPartyName, secondPartyAddress, googleMapsUrl, showLocationQr, fieldPositions, createdAt, updatedAt, status }) => ({
        id, contractNumber, startDate, startHijriDate, endDate, endHijriDate, secondPartyName, secondPartyAddress, googleMapsUrl, showLocationQr, fieldPositions, createdAt, updatedAt, status
      }));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lightweight));
    } catch (fallbackErr) {
      console.error('Failed to save lightweight contracts', fallbackErr);
    }
  }
}
