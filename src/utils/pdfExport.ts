// @ts-ignore
import html2pdf from 'html2pdf.js';

export function printDocument() {
  window.print();
}

export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF export.`);
    return;
  }

  // Configuration options for html2pdf
  const opt = {
    margin: [0, 0, 0, 0] as [number, number, number, number],
    filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      onclone: (clonedDoc: Document) => {
        // Fix for html2canvas unsupported 'oklch' color function in Tailwind CSS v4
        const styleElements = clonedDoc.querySelectorAll('style');
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
            // Replace all oklch(...) color definitions with a safe fallback hex color
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

        // Ensure positioning helper outlines/rectangles are hidden in PDF output
        const clonedContract = clonedDoc.getElementById(elementId);
        if (clonedContract) {
          clonedContract.classList.remove('ring-2', 'ring-blue-500/50');
          const positioningRects = clonedContract.querySelectorAll('rect[stroke="#3b82f6"]');
          positioningRects.forEach((r) => r.remove());
        }
      }
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4' as const,
      orientation: 'portrait' as const
    }
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fallback to print if html2pdf encounters an issue
    printDocument();
  }
}


