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
  let result = cssText;

  // Replace oklch(...)
  result = result.replace(/oklch\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');
  // Replace oklab(...)
  result = result.replace(/oklab\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');
  // Replace color-mix(...)
  result = result.replace(/color-mix\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');
  // Replace light-dark(...)
  result = result.replace(/light-dark\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');
  // Replace lch(...)
  result = result.replace(/lch\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');
  // Replace lab(...)
  result = result.replace(/lab\s*\([^()]*?(?:\([^()]*?\)[^()]*?)*\)/gi, '#1e293b');

  // Fallback catch-all
  result = result.replace(/oklch\([^)]*\)/gi, '#1e293b');
  result = result.replace(/oklab\([^)]*\)/gi, '#1e293b');

  return result;
}

/**
 * Converts image source URLs inside an element to base64 data URLs safely
 * to ensure html2canvas captures them without CORS/taint errors.
 */
async function preConvertImagesToDataUrls(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  for (const img of images) {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) continue;

    try {
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) continue;
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
      console.warn('Image pre-conversion notice (using direct src fallback):', src, err);
    }
  }
}

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  // Find element by id or fallback to wrapper selector
  let element = document.getElementById(elementId);
  if (!element) {
    element = document.querySelector('.printable-area-wrapper #printable-contract') as HTMLElement;
  }

  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    throw new Error('عنصر العقد غير موجود للطباعة');
  }

  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  let iframe: HTMLIFrameElement | null = null;

  try {
    // Pre-convert images to Base64 data URLs if possible
    await preConvertImagesToDataUrls(element);

    // Create an isolated sandbox iframe to completely bypass main document's Tailwind v4 oklch stylesheets
    iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '794px';
    iframe.style.height = '1123px';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    iframe.style.zIndex = '-99999';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      throw new Error('Could not access sandbox iframe document');
    }

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="ltr">
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 794px; height: 1123px; background: #ffffff; font-family: 'Traditional Arabic', 'Amiri', 'Segoe UI', 'Sakkal Majalla', sans-serif; overflow: hidden; }
          .w-full { width: 100% !important; }
          .h-full { height: 100% !important; }
          .object-fill { object-fit: fill !important; }
          .absolute { position: absolute !important; }
          .relative { position: relative !important; }
          .inset-0 { top: 0 !important; right: 0 !important; bottom: 0 !important; left: 0 !important; }
          .block { display: block !important; }
          .flex { display: flex !important; }
          .items-center { align-items: center !important; }
          .justify-center { justify-content: center !important; }
          .select-none { user-select: none !important; }
          .bg-white { background-color: #ffffff !important; }
          .bg-transparent { background-color: transparent !important; }
          .text-slate-900 { color: #0f172a !important; }
          .overflow-hidden { overflow: hidden !important; }
        </style>
      </head>
      <body style="width:794px; height:1123px; margin:0; padding:0; background:#ffffff;">
      </body>
      </html>
    `);
    iframeDoc.close();

    // Copy and sanitize any <style> tags from main document to preserve custom font definitions
    Array.from(document.querySelectorAll('style')).forEach((styleTag) => {
      try {
        if (styleTag.textContent) {
          const sanitizedCss = replaceUnsupportedColorFunctions(styleTag.textContent);
          const newStyle = iframeDoc.createElement('style');
          newStyle.textContent = sanitizedCss;
          iframeDoc.head.appendChild(newStyle);
        }
      } catch (err) {
        console.warn('Notice when copying style element to sandbox:', err);
      }
    });

    // Clone target contract element
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    clone.style.width = '794px';
    clone.style.height = '1123px';
    clone.style.maxWidth = '794px';
    clone.style.maxHeight = '1123px';
    clone.style.margin = '0';
    clone.style.padding = '0';
    clone.style.transform = 'none';
    clone.style.boxSizing = 'border-box';
    clone.style.backgroundColor = '#ffffff';

    // Remove interactive ring/highlight/shadow classes
    clone.classList.remove('ring-2', 'ring-blue-500/50', 'ring-4', 'ring-amber-400', 'shadow-2xl');

    // Sanitize any inline style attributes on cloned element and descendants
    if (clone.getAttribute('style')) {
      clone.setAttribute('style', replaceUnsupportedColorFunctions(clone.getAttribute('style') || ''));
    }
    clone.querySelectorAll('*').forEach((el) => {
      const styleAttr = el.getAttribute('style');
      if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab') || styleAttr.includes('color-mix'))) {
        el.setAttribute('style', replaceUnsupportedColorFunctions(styleAttr));
      }
    });

    iframeDoc.body.appendChild(clone);

    // Allow browser time to resolve fonts and layout
    await new Promise((r) => setTimeout(r, 150));

    // Render element to canvas using html2canvas inside the clean sandbox iframe
    const canvas = await html2canvas(clone, {
      scale: 2, // 300 DPI high clarity
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      height: 1123,
      windowWidth: 794,
      windowHeight: 1123,
    });

    // Clean up sandbox iframe
    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
      iframe = null;
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

    // Cross-platform PDF Save & Download
    try {
      pdf.save(cleanFilename);
    } catch (saveError) {
      console.warn('pdf.save fallback to blob URL download link:', saveError);
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
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    if (iframe && document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
    throw error;
  }
}
