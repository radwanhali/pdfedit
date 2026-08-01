import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function printDocument() {
  try {
    window.print();
  } catch (err) {
    console.error('Print failed:', err);
  }
}

/**
 * Replaces modern CSS color functions unsupported by html2canvas (oklch, oklab, color-mix, etc.)
 */
function replaceUnsupportedColorFunctions(cssText: string): string {
  if (!cssText) return '';
  return cssText
    .replace(/color-mix\s*\((?:[^\(\)]|\([^\(\)]*\))*\)/gi, '#1e293b')
    .replace(/light-dark\s*\((?:[^\(\)]|\([^\(\)]*\))*\)/gi, '#1e293b')
    .replace(/oklch\s*\([\s\S]*?\)/gi, '#1e293b')
    .replace(/oklab\s*\([\s\S]*?\)/gi, '#1e293b')
    .replace(/lch\s*\([\s\S]*?\)/gi, '#1e293b')
    .replace(/lab\s*\([\s\S]*?\)/gi, '#1e293b');
}

/**
 * Converts image source URLs inside an element to base64 data URLs
 * to ensure html2canvas can capture them without CORS/taint errors.
 */
async function preConvertImagesToDataUrls(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  
  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;

    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('Failed to convert blob to data URL'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      img.setAttribute('src', dataUrl);
    } catch (err) {
      console.warn('Failed to pre-convert image to data URL:', src, err);
    }
  }
}

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    throw new Error('عنصر العقد غير موجود للطباعة');
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    // Pre-convert all images to Base64 data URLs before capturing to prevent canvas taint
    await preConvertImagesToDataUrls(element);

    // Render element to canvas using html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp PDF text and QR code
      useCORS: true,
      allowTaint: false, // Critical: Must be false so canvas.toDataURL() never fails
      logging: false,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Sanitize head innerHTML if present
        if (clonedDoc.head) {
          clonedDoc.head.innerHTML = replaceUnsupportedColorFunctions(clonedDoc.head.innerHTML);
        }

        // Sanitize all style elements
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent) {
            styleEl.textContent = replaceUnsupportedColorFunctions(styleEl.textContent);
          }
        });

        // Clean inline styles on elements in cloned document
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const styleAttr = el.getAttribute('style');
          if (
            styleAttr &&
            (styleAttr.includes('oklch') ||
              styleAttr.includes('color-mix') ||
              styleAttr.includes('light-dark') ||
              styleAttr.includes('oklab'))
          ) {
            el.setAttribute('style', replaceUnsupportedColorFunctions(styleAttr));
          }
        });

        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.classList.remove('ring-2', 'ring-blue-500/50', 'ring-4', 'ring-amber-400');
        }
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create jsPDF instance (A4 size: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Fit image exactly to A4 page dimensions
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Direct browser file download
    pdf.save(cleanFilename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
