import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function printDocument() {
  try {
    window.print();
  } catch (err) {
    console.error('Print failed:', err);
  }
}

async function convertImgToDataUrl(img: HTMLImageElement): Promise<string | null> {
  if (!img.src || img.src.startsWith('data:')) {
    return img.src || null;
  }

  // Strategy 1: Render onto offscreen canvas
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.clientWidth || 794;
    canvas.height = img.naturalHeight || img.clientHeight || 1123;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl && dataUrl.length > 200) {
        return dataUrl;
      }
    }
  } catch {
    // Ignore canvas CORS taint error and try fetch
  }

  // Strategy 2: Fetch blob and convert via FileReader
  try {
    const response = await fetch(img.src);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Image fetch to Data URL failed:', err);
    return null;
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
    // Render element to canvas using html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for crisp PDF text and QR code
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      onclone: async (clonedDoc) => {
        // Pre-process all images in the cloned document to base64 Data URLs
        const images = Array.from(clonedDoc.querySelectorAll('img'));
        for (const img of images) {
          if (img.src && !img.src.startsWith('data:')) {
            const dataUrl = await convertImgToDataUrl(img);
            if (dataUrl) {
              img.src = dataUrl;
            }
          }
        }

        // Fix for html2canvas unsupported 'oklch' color function in Tailwind CSS v4
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent) {
            styleEl.textContent = styleEl.textContent.replace(
              /oklch\([^)]+\)/gi,
              '#1e293b'
            );
          }
        });

        // Clean inline styles on elements in cloned document
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && styleAttr.includes('oklch')) {
            el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/gi, '#1e293b'));
          }
        });

        const clonedElement = clonedDoc.getElementById(elementId);
        if (clonedElement) {
          clonedElement.classList.remove('ring-2', 'ring-blue-500/50');
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



