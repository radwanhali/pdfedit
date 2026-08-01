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
 * to ensure html2canvas can capture them without CORS/taint errors on mobile/desktop.
 */
async function preConvertImagesToDataUrls(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;

    try {
      const response = await fetch(src, { mode: 'cors' });
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
    // Pre-convert images to Base64 data URLs
    await preConvertImagesToDataUrls(element);

    // Create a temporary clone with fixed A4 dimensions in body to guarantee 100% accurate rendering on Mobile & Desktop
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.width = '794px';
    clone.style.height = '1123px';
    clone.style.maxWidth = '794px';
    clone.style.maxHeight = '1123px';
    clone.style.zIndex = '-99999';
    clone.style.opacity = '1';
    clone.style.transform = 'none';
    clone.style.boxSizing = 'border-box';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.backgroundColor = '#ffffff';

    // Remove positioning/highlight ring classes if present
    clone.classList.remove('ring-2', 'ring-blue-500/50', 'ring-4', 'ring-amber-400', 'shadow-2xl');

    document.body.appendChild(clone);

    // Wait 100ms for browser layout & fonts
    await new Promise((r) => setTimeout(r, 100));

    // Render element to canvas using html2canvas with explicit desktop window width
    const canvas = await html2canvas(clone, {
      scale: 2, // 300 DPI high resolution
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 1200,
      windowHeight: 1600,
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
      },
    });

    // Remove clone from DOM
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create jsPDF instance (A4 size: 210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Fit image exactly to A4 page dimensions (210mm x 297mm)
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');

    // Cross-platform mobile & desktop file download using Blob URL
    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = cleanFilename;
    downloadLink.target = '_blank';
    downloadLink.rel = 'noopener';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
