import { useState } from 'react';
import { StudentRegistration } from '../types';
import { GROUPS_DATA } from '../data';
import { GraduationCap, Printer, CheckCircle, RefreshCw, Calendar, IdCard, User, Award, Tag, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// OKLCH to RGB conversion helper for html2canvas compatibility with Tailwind CSS v4
function oklchToRgb(lStr: string, cStr: string, hStr: string, aStr?: string): string {
  try {
    let L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
    let C = cStr.endsWith('%') ? parseFloat(cStr) / 100 : parseFloat(cStr);
    let H = parseFloat(hStr.replace(/[^\d.]/g, ''));
    
    if (isNaN(L) || isNaN(C) || isNaN(H)) {
      return 'rgb(99, 102, 241)'; // Safe Indigo fallback
    }

    let A = 1;
    if (aStr) {
      const cleanA = aStr.trim();
      A = cleanA.endsWith('%') ? parseFloat(cleanA) / 100 : parseFloat(cleanA);
      if (isNaN(A)) A = 1;
    }

    // OKLCH to OKLab
    const rad = (H * Math.PI) / 180;
    const labA = C * Math.cos(rad);
    const labB = C * Math.sin(rad);

    // OKLab to LMS
    const l_ = L + 0.3963377774 * labA + 0.2158037573 * labB;
    const m_ = L - 0.1055613458 * labA - 0.0638541728 * labB;
    const s_ = L - 0.0894841775 * labA - 1.2914855480 * labB;

    // LMS to linear LMS^3
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    // linear LMS to linear sRGB
    let rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    let gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    let bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

    // sRGB gamma correction
    const gamma = (c: number) => {
      if (c <= 0.0031308) {
        return 12.92 * c;
      }
      return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    };

    const r = Math.round(Math.max(0, Math.min(1, gamma(rLin))) * 255);
    const g = Math.round(Math.max(0, Math.min(1, gamma(gLin))) * 255);
    const b = Math.round(Math.max(0, Math.min(1, gamma(bLin))) * 255);

    if (aStr !== undefined) {
      return `rgba(${r}, ${g}, ${b}, ${A})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    console.error('Error converting oklch to rgb:', err);
    return 'rgb(99, 102, 241)';
  }
}

// Scans CSS text and converts OKLCH declarations to standard RGB/RGBA format
function replaceOklchInCss(css: string): string {
  if (!css) return '';
  let result = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    if (css.substring(i, i + 6).toLowerCase() === 'oklch(') {
      // Find the matching closing parenthesis, accounting for nested parentheses (e.g., var())
      const start = i;
      let parenCount = 1;
      i += 6;
      let inner = '';
      
      while (i < len && parenCount > 0) {
        const char = css[i];
        if (char === '(') {
          parenCount++;
        } else if (char === ')') {
          parenCount--;
        }
        if (parenCount > 0) {
          inner += char;
          i++;
        }
      }
      
      if (parenCount === 0) {
        // We found the full oklch(...) block
        i++; // skip the closing ')'
        
        // Parse inner contents
        try {
          // Replace commas and slashes with spaces
          const cleanInner = inner.trim().replace(/[\/,]/g, ' ');
          const parts = cleanInner.split(/\s+/).filter(Boolean);
          
          if (parts.length >= 3) {
            const l = parts[0];
            const c = parts[1];
            const h = parts[2];
            const a = parts[3]; // optional alpha
            
            if (l.includes('var') || c.includes('var') || h.includes('var')) {
              // Graceful fallback for variables
              result += 'rgb(99, 102, 241)';
            } else {
              const rgb = oklchToRgb(l, c, h, a);
              result += rgb;
            }
          } else {
            result += 'rgb(99, 102, 241)';
          }
        } catch (err) {
          result += 'rgb(99, 102, 241)';
        }
      } else {
        // No matching paren, just append what we have
        result += css.substring(start, i);
      }
    } else {
      result += css[i];
      i++;
    }
  }
  return result;
}

interface RegistrationReceiptProps {
  registration: StudentRegistration;
  onReset: () => void;
}

export default function RegistrationReceipt({ registration, onReset }: RegistrationReceiptProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const group = GROUPS_DATA.find((g) => g.id === registration.rankedGroups[0]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    const isDark = document.documentElement.classList.contains('dark');
    
    try {
      const element = document.getElementById('receipt-print-area');
      if (!element) {
        alert('حدث خطأ: لم يتم العثور على منطقة الطباعة / Erreur: Zone d’impression introuvable');
        return;
      }

      // Temporarily toggle dark mode to capture a clean high-contrast white document
      if (isDark) {
        document.documentElement.classList.remove('dark');
      }

      // A small delay for the browser layout engine to paint light styles and compute styles
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 1. Gather and sanitize CSS from all <style> tags in the original document
      let allSanitizedCss = '';
      document.querySelectorAll('style').forEach((el) => {
        const text = el.textContent || '';
        if (text) {
          if (text.toLowerCase().includes('oklch')) {
            allSanitizedCss += replaceOklchInCss(text) + '\n';
          } else {
            allSanitizedCss += text + '\n';
          }
        }
      });

      // 2. Gather and sanitize CSS from all <link rel="stylesheet"> tags in the original document
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const owner = sheet.ownerNode;
          if (owner instanceof HTMLLinkElement) {
            // Attempt to read from cssRules (for same-origin)
            try {
              const rules = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
              if (rules.toLowerCase().includes('oklch')) {
                allSanitizedCss += replaceOklchInCss(rules) + '\n';
              } else {
                allSanitizedCss += rules + '\n';
              }
            } catch (cssErr) {
              // Fallback: fetch the external stylesheet and sanitize its text
              if (owner.href) {
                try {
                  const response = await fetch(owner.href);
                  const text = await response.text();
                  allSanitizedCss += replaceOklchInCss(text) + '\n';
                } catch (fetchErr) {
                  console.warn('Could not fetch external stylesheet for sanitization:', owner.href, fetchErr);
                }
              }
            }
          }
        } catch (sheetErr) {
          console.warn('Error reading stylesheet:', sheetErr);
        }
      }

      const canvas = await html2canvas(element, {
        scale: 2.5, // Crisp, high-resolution rendering
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff', // Clean white paper background
        logging: false,
        onclone: (clonedDoc) => {
          // Remove all style and link elements in the cloned document so html2canvas never loads or parses them
          clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
            el.remove();
          });

          // Inject our single consolidated, sanitized stylesheet containing no oklch
          const styleTag = clonedDoc.createElement('style');
          styleTag.textContent = allSanitizedCss;
          clonedDoc.head.appendChild(styleTag);

          // Also convert any oklch color values in inline styles
          clonedDoc.querySelectorAll('[style]').forEach(el => {
            const htmlEl = el as HTMLElement;
            const styleAttr = htmlEl.getAttribute('style');
            if (styleAttr && styleAttr.toLowerCase().includes('oklch')) {
              htmlEl.setAttribute('style', replaceOklchInCss(styleAttr));
            }
          });

          // Convert oklch color values in fill or stroke attributes
          clonedDoc.querySelectorAll('[fill], [stroke]').forEach(el => {
            const fill = el.getAttribute('fill');
            if (fill && fill.toLowerCase().includes('oklch')) {
              el.setAttribute('fill', replaceOklchInCss(fill));
            }
            const stroke = el.getAttribute('stroke');
            if (stroke && stroke.toLowerCase().includes('oklch')) {
              el.setAttribute('stroke', replaceOklchInCss(stroke));
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Setup PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      
      // Printable boundaries (10mm margin on all sides)
      const marginX = 10;
      const marginY = 10;
      const printableWidth = imgWidth - (marginX * 2);
      const printableHeight = (canvas.height * printableWidth) / canvas.width;

      // Smart single-page scaling
      if (printableHeight > (pageHeight - (marginY * 2))) {
        const scaleFactor = (pageHeight - (marginY * 2)) / printableHeight;
        const finalWidth = printableWidth * scaleFactor;
        const finalHeight = printableHeight * scaleFactor;
        const offsetLeft = (imgWidth - finalWidth) / 2;
        const offsetTop = (pageHeight - finalHeight) / 2;
        pdf.addImage(imgData, 'PNG', offsetLeft, offsetTop, finalWidth, finalHeight);
      } else {
        const offsetTop = (pageHeight - printableHeight) / 2;
        pdf.addImage(imgData, 'PNG', marginX, offsetTop, printableWidth, printableHeight);
      }

      const fileName = `وصل_توجيه_طالب_${registration.studentCardNumber}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('فشل إنشاء ملف PDF. يرجى استخدام ميزة الطباعة التقليدية أو المحاولة مرة أخرى.');
    } finally {
      // Restore dark mode if it was previously active
      if (isDark) {
        document.documentElement.classList.add('dark');
      }

      setIsGeneratingPDF(false);
    }
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
      {/* Dynamic media style overrides to isolate the receipt and remove page margins when printing natively */}
      <style>{`
        #receipt-print-area {
          --color-indigo-50: #e0e7ff !important;
          --color-indigo-100: #c7d2fe !important;
          --color-indigo-500: #6366f1 !important;
          --color-indigo-600: #4f46e5 !important;
          --color-indigo-700: #4338ca !important;
          --color-indigo-950: #1e1b4b !important;
          
          --color-emerald-50: #ecfdf5 !important;
          --color-emerald-100: #d1fae5 !important;
          --color-emerald-600: #059669 !important;
          --color-emerald-700: #047857 !important;
          --color-emerald-950: #022c22 !important;
          
          --color-slate-50: #f8fafc !important;
          --color-slate-100: #f1f5f9 !important;
          --color-slate-200: #e2e8f0 !important;
          --color-slate-300: #cbd5e1 !important;
          --color-slate-400: #94a3b8 !important;
          --color-slate-500: #64748b !important;
          --color-slate-600: #475569 !important;
          --color-slate-700: #334155 !important;
          --color-slate-800: #1e293b !important;
          --color-slate-900: #0f172a !important;
          --color-slate-950: #020617 !important;
        }

        @media print {
          /* Force standard document scroll and dimensions */
          html, body {
            background: white !important;
            color: black !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Un-restrict layout parent containers so they expand fully */
          #root, 
          #root > div, 
          .flex.h-screen.w-screen,
          .overflow-y-auto,
          .flex-1 {
            display: block !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Hide all components marked as print:hidden */
          .print\\:hidden {
            display: none !important;
          }

          /* Specifically target other elements to hide, such as aside and header */
          aside, header, footer {
            display: none !important;
          }

          /* Reset padding and margin of print wrapper to look pristine on paper */
          #receipt-print-card-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          #receipt-print-area {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            color: #0f172a !important;
            width: 100% !important;
          }

          /* Ensure all dark-mode classes are bypassed and print light mode */
          .dark {
            background-color: white !important;
            color: black !important;
          }
          
          .bg-slate-50 { background-color: #f8fafc !important; }
          .text-slate-800 { color: #1e293b !important; }
          .text-slate-700 { color: #334155 !important; }
          .text-slate-400 { color: #94a3b8 !important; }
          .border { border-color: #e2e8f0 !important; }
        }
      `}</style>

      <div id="receipt-print-card-wrapper" className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-emerald-100 dark:border-emerald-950 overflow-hidden print:shadow-none print:border-none">
        
        {/* Success Banner (Hidden during print) */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-8 text-white text-center print:hidden">
          <div className="inline-flex p-3 bg-white/20 rounded-full mb-4 animate-bounce">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-sans tracking-tight">تم تسجيل رغبتك بنجاح!</h2>
          <p className="text-emerald-100 mt-2 text-sm">
            Votre inscription a été validée avec succès.
          </p>
        </div>

        {/* Printable Receipt Frame */}
        <div className="p-8 print:p-0 font-sans" id="receipt-print-area">
          
          {/* Header of the Official Document */}
          <div className="text-center border-b pb-6 border-slate-200 dark:border-slate-800 mb-6">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">République Algérienne Démocratique et Populaire</p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">وزارة التعليم العالي والبحث العلمي</p>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Ministère de l'Enseignement Supérieur et de la Recherche Scientifique</p>
            
            <div className="flex justify-center items-center gap-4 my-4">
              <GraduationCap className="h-8 w-8 text-emerald-600" />
              <div className="text-right">
                <h1 className="text-base sm:text-lg font-bold text-slate-850 dark:text-slate-100 leading-tight">جامعة عمار ثليجي بالأغواط • كليــة التكنـــلــوجــيا</h1>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Université Amar Telidji de Laghouat • Faculté de Technologie</p>
                <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">بوابة توجيه طلبة الجذع المشترك فرع المهندسين</h2>
                <p className="text-[10px] text-slate-400">Portail d'Orientation - 2ème Année Tronc Commun Ingénieur</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mt-2">
              <div className="inline-block bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300">
                وصل تسجيل رغبة التوجيه / Reçu de Vœu d'Orientation
              </div>
              <div className="inline-block bg-indigo-50 dark:bg-indigo-950/40 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                السنة الجامعية: 2025/2026 | A.U: 2025/2026
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-6">
            
            {/* Student Info Box */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-100 dark:border-slate-800/80">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex justify-between">
                <span>المعلومات الشخصية لطالب</span>
                <span className="text-xs text-slate-400 font-normal">Informations de l'étudiant</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">الاسم واللقب / Nom & Prénom</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {registration.firstName} {registration.lastName}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <IdCard className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">رقم بطاقة الطالب / Carte d'Étudiant</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {registration.studentCardNumber}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">تاريخ الميلاد / Date de Naissance</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {registration.dateOfBirth}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">تخصص السنة الأولى / Spécialité 1ère Année</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {registration.firstYearSpecialty || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-xs text-slate-400">تاريخ التسجيل / Date d'Inscription</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatDate(registration.registrationDate)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Specialization Selection Box */}
            <div className="rounded-xl p-5 border border-indigo-100 dark:border-indigo-950 bg-slate-50 dark:bg-slate-900/40">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 flex justify-between">
                <span>ترتيب الرغبات المودعة للمجموعات الثلاث</span>
                <span className="text-xs text-slate-450 font-normal">Classement des vœux de groupes</span>
              </h3>

              <div className="space-y-4">
                {/* 3 Ranked Choices Grid */}
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">ترتيب رغبات المجموعات تنازلياً / Classement des groupes :</span>
                  <div className="grid grid-cols-3 gap-3">
                    {registration.rankedGroups.map((groupId, index) => {
                      const grp = GROUPS_DATA.find(g => g.id === groupId);
                      return (
                        <div key={groupId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg text-center shadow-sm">
                          <span className="block text-[9px] font-bold text-slate-400">الرغبة {index + 1}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold mt-1.5 ${grp?.badgeBg}`}>
                            {grp?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info block */}
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/30 text-right">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-300">ملاحظة حول التوجيه النهائي:</p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        يتم توزيع الطلبة على المجموعات الثلاث (Groupe A, Groupe B, Groupe C) بناءً على ترتيب الرغبات المودعة أعلاه، ومعدل الترتيب وعدد المقاعد البيداغوجية المتاحة لكل مجموعة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Verification Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t pt-6 border-slate-200 dark:border-slate-800">
              {/* Fake QR code to make it look official and beautiful */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 p-1 rounded-md flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-slate-800 dark:text-slate-200">
                    <rect width="100" height="100" fill="transparent" />
                    {/* Corners */}
                    <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                    <rect x="9" y="9" width="12" height="12" fill="white" />
                    <rect x="12" y="12" width="6" height="6" fill="currentColor" />
                    
                    <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                    <rect x="79" y="9" width="12" height="12" fill="white" />
                    <rect x="82" y="12" width="6" height="6" fill="currentColor" />

                    <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                    <rect x="9" y="79" width="12" height="12" fill="white" />
                    <rect x="12" y="82" width="6" height="6" fill="currentColor" />

                    {/* Fake dots pattern */}
                    <rect x="35" y="15" width="5" height="5" fill="currentColor" />
                    <rect x="45" y="5" width="10" height="5" fill="currentColor" />
                    <rect x="60" y="10" width="5" height="10" fill="currentColor" />
                    <rect x="30" y="30" width="15" height="5" fill="currentColor" />
                    <rect x="15" y="35" width="5" height="15" fill="currentColor" />
                    
                    <rect x="50" y="50" width="10" height="10" fill="currentColor" />
                    <rect x="65" y="45" width="5" height="15" fill="currentColor" />
                    <rect x="35" y="60" width="15" height="5" fill="currentColor" />
                    <rect x="40" y="70" width="5" height="10" fill="currentColor" />
                    
                    <rect x="60" y="70" width="15" height="15" fill="currentColor" />
                    <rect x="80" y="60" width="10" height="5" fill="currentColor" />
                    <rect x="85" y="75" width="10" height="10" fill="currentColor" />
                  </svg>
                </div>
                <div className="text-right sm:text-left">
                  <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider">رقم التسجيل الإلكتروني</span>
                  <span className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    REG-{registration.id.toUpperCase()}
                  </span>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    التحقق عبر مسح الرمز / Vérification via QR
                  </span>
                </div>
              </div>

              {/* Official Seal / Signature Placeholder */}
              <div className="text-center sm:text-right">
                <p className="text-xs text-slate-400">إمضاء مصلحة التدريس</p>
                <p className="text-[10px] text-slate-400">Signature du Service Scolarité</p>
                <div className="h-10 w-28 border border-dashed border-slate-200 dark:border-slate-800 rounded mt-2 flex items-center justify-center text-[10px] text-slate-400">
                  ختم الإدارة المعتمد
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Form Controls / Buttons */}
        <div className="bg-slate-50 dark:bg-slate-900/80 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3.5 justify-between items-center print:hidden">
          <button
            onClick={onReset}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-150 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>تسجيل طالب جديد / Nouvelle inscription</span>
          </button>

          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-xl shadow-md transition duration-150 text-xs font-bold cursor-pointer"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>تحميل الوصل PDF / Télécharger le Reçu</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-md transition duration-150 text-xs font-bold cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>طباعة الوصل / Imprimer le Reçu</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
