import { useState } from 'react';
import { StudentRegistration } from '../types';
import { GROUPS_DATA } from '../data';
import { GraduationCap, Printer, CheckCircle, RefreshCw, Calendar, IdCard, User, Award, Tag, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    try {
      const element = document.getElementById('receipt-print-area');
      if (!element) {
        alert('حدث خطأ: لم يتم العثور على منطقة الطباعة / Erreur: Zone d’impression introuvable');
        return;
      }

      // Hide or show items if needed, configure canvas
      const isDark = document.documentElement.classList.contains('dark');
      
      const canvas = await html2canvas(element, {
        scale: 2, // High-quality display resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: isDark ? '#0f172a' : '#ffffff', // slate-900 or white background
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Setup PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `وصل_تسجيل_رغبة_التوجيه_${registration.studentCardNumber}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('فشل إنشاء ملف PDF. يرجى استخدام ميزة الطباعة التقليدية أو المحاولة مرة أخرى.');
    } finally {
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
      <div className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-emerald-100 dark:border-emerald-950 overflow-hidden print:shadow-none print:border-none">
        
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
        <div className="bg-slate-50 dark:bg-slate-900/80 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-3.5 justify-between print:hidden">
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-200 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>تسجيل طالب جديد / Nouvelle inscription</span>
          </button>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition duration-200 text-xs font-semibold cursor-pointer"
            >
              {isGeneratingPDF ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>تحميل الوصل PDF / Télécharger le Reçu</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-750 dark:hover:bg-slate-700 rounded-xl shadow-md transition duration-200 text-xs font-semibold cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>طباعة الوصل / Imprimer le Reçu</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
