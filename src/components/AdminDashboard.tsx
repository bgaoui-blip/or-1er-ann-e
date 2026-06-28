import React, { useState } from 'react';
import { StudentRegistration } from '../types';
import { GROUPS_DATA } from '../data';
import { Search, Trash2, FileSpreadsheet, RefreshCw, Filter, Users, Award, TrendingUp, CheckCircle, HelpCircle, GraduationCap, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  registrations: StudentRegistration[];
  onDeleteRegistration: (id: string) => void;
  onClearAll: () => void;
  onResetToMockData: () => void;
  onImportRegistrations: (imported: StudentRegistration[]) => void;
}

export default function AdminDashboard({
  registrations,
  onDeleteRegistration,
  onClearAll,
  onResetToMockData,
  onImportRegistrations
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [hoveredSegment, setHoveredSegment] = useState<'A' | 'B' | 'C' | null>(null);

  // Compute stats
  const totalCount = registrations.length;
  
  const groupStats = {
    A: registrations.filter(r => r.rankedGroups && r.rankedGroups[0] === 'A').length,
    B: registrations.filter(r => r.rankedGroups && r.rankedGroups[0] === 'B').length,
    C: registrations.filter(r => r.rankedGroups && r.rankedGroups[0] === 'C').length,
  };

  const getPercentage = (count: number) => {
    if (totalCount === 0) return 0;
    return Math.round((count / totalCount) * 100);
  };

  // Circular Trigonometric Donut Chart calculations
  const rad = 50;
  const circum = 2 * Math.PI * rad; // ~314.159
  const totalVal = groupStats.A + groupStats.B + groupStats.C;

  const lenA = totalVal > 0 ? (groupStats.A / totalVal) * circum : 0;
  const lenB = totalVal > 0 ? (groupStats.B / totalVal) * circum : 0;
  const lenC = totalVal > 0 ? (groupStats.C / totalVal) * circum : 0;

  const offsetA = 0;
  const offsetB = -lenA;
  const offsetC = -(lenA + lenB);

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const fullName = `${reg.firstName} ${reg.lastName}`.toLowerCase();
    const cardNum = reg.studentCardNumber.toLowerCase();
    const query = searchTerm.toLowerCase();
    
    const matchesSearch = fullName.includes(query) || cardNum.includes(query);
    const primaryGroup = reg.rankedGroups && reg.rankedGroups[0];
    const matchesGroup = selectedGroupFilter === 'all' || primaryGroup === selectedGroupFilter;
    
    return matchesSearch && matchesGroup;
  });

  // Export to Excel Function using SheetJS (.xlsx)
  const handleExportExcel = () => {
    if (registrations.length === 0) return;

    // Prepare data with Arabic & French headers - Each wish in its own column!
    const data = registrations.map(reg => {
      const rankedString = reg.rankedGroups ? reg.rankedGroups.join(' ➔ ') : '';
      return {
        'ID': reg.id,
        'اللقب / Nom': reg.lastName,
        'الاسم / Prénom': reg.firstName,
        'تاريخ الميلاد / Date de Naissance': reg.dateOfBirth,
        'رقم بطاقة الطالب / N° Carte Étudiant': reg.studentCardNumber,
        'تخصص السنة الأولى / Spécialité 1ère Année': reg.firstYearSpecialty || '',
        'الرغبة الأولى / 1er Vœu': reg.rankedGroups && reg.rankedGroups[0] ? `الفوج ${reg.rankedGroups[0]}` : '',
        'الرغبة الثانية / 2ème Vœu': reg.rankedGroups && reg.rankedGroups[1] ? `الفوج ${reg.rankedGroups[1]}` : '',
        'الرغبة الثالثة / 3ème Vœu': reg.rankedGroups && reg.rankedGroups[2] ? `الفوج ${reg.rankedGroups[2]}` : '',
        'ترتيب الرغبات الكامل / Ordre des Vœux': rankedString,
        'تاريخ التسجيل / Date Inscription': reg.registrationDate
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الرغبات Orientation');

    // Set columns widths for neat rendering
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 18 }, // Nom
      { wch: 18 }, // Prénom
      { wch: 20 }, // Date of birth
      { wch: 22 }, // Card number
      { wch: 35 }, // Specialty
      { wch: 22 }, // Vœu 1
      { wch: 22 }, // Vœu 2
      { wch: 22 }, // Vœu 3
      { wch: 24 }, // Full order
      { wch: 28 }, // Date
    ];

    // Write file
    XLSX.writeFile(workbook, `orientation_ingenieurs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Import from Excel Function using SheetJS (.xlsx / .xls)
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rawData.length === 0) {
          alert('ملف Excel فارغ! / Le fichier Excel est vide !');
          return;
        }

        // Map rows to StudentRegistration
        const imported: StudentRegistration[] = rawData.map((row: any) => {
          const lastName = row['اللقب / Nom'] || row['Nom'] || row['اللقب'] || '';
          const firstName = row['الاسم / Prénom'] || row['Prénom'] || row['الاسم'] || '';
          const dateOfBirth = row['تاريخ الميلاد / Date de Naissance'] || row['Date de Naissance'] || row['تاريخ الميلاد'] || '';
          let studentCardNumber = row['رقم بطاقة الطالب / N° Carte Étudiant'] || row['N° Carte Étudiant'] || row['رقم بطاقة الطالب'] || row['N° Carte'] || '';
          studentCardNumber = String(studentCardNumber).trim();
          
          const firstYearSpecialty = row['تخصص السنة الأولى / Spécialité 1ère Année'] || row['تخصص السنة الأولى'] || row['Spécialité'] || row['شعبة البكالوريا / Série de Bac'] || row['شعبة البكالوريا'] || '';
          
          // Parse ranked groups from either individual columns or sequence string
          let rankedGroups: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
          
          const v1 = row['الرغبة الأولى / 1er Vœu'] || row['الرغبة الأولى'] || row['الرغبة 1'] || row['1er Vœu'] || row['1er Voeu'];
          const v2 = row['الرغبة الثانية / 2ème Vœu'] || row['الرغبة الثانية'] || row['الرغبة 2'] || row['2ème Vœu'] || row['2eme Voeu'];
          const v3 = row['الرغبة الثالثة / 3ème Vœu'] || row['الرغبة الثالثة'] || row['الرغبة 3'] || row['3ème Vœu'] || row['3eme Voeu'];
          
          const extractLetter = (val: any): 'A' | 'B' | 'C' | null => {
            if (!val) return null;
            const str = String(val).toUpperCase();
            if (str.includes('A')) return 'A';
            if (str.includes('B')) return 'B';
            if (str.includes('C')) return 'C';
            return null;
          };

          const grp1 = extractLetter(v1);
          const grp2 = extractLetter(v2);
          const grp3 = extractLetter(v3);

          if (grp1 && grp2 && grp3) {
            rankedGroups = [grp1, grp2, grp3];
          } else {
            const rankedString = row['ترتيب الرغبات الكامل / Ordre des Vœux'] || row['ترتيب الرغبات / Ordre des Vœux'] || row['ترتيب الرغبات'] || row['Ordre des Vœux'] || '';
            if (rankedString) {
              const cleanStr = String(rankedString).replace(/[\s➔>,\-]/g, '');
              const chars = cleanStr.split('').filter(c => ['A', 'B', 'C'].includes(c.toUpperCase())) as ('A' | 'B' | 'C')[];
              if (chars.length === 3) {
                rankedGroups = chars.map(c => c.toUpperCase() as 'A' | 'B' | 'C');
              }
            }
          }

          const registrationDate = row['تاريخ التسجيل / Date Inscription'] || row['Date Inscription'] || new Date().toISOString();

          return {
            id: row['ID'] || ('reg_' + Math.random().toString(36).substring(2, 11)),
            firstName: String(firstName).trim(),
            lastName: String(lastName).trim(),
            dateOfBirth: String(dateOfBirth).trim(),
            studentCardNumber,
            firstYearSpecialty: String(firstYearSpecialty).trim(),
            rankedGroups,
            registrationDate: String(registrationDate).trim()
          };
        });

        // Validate
        const validImported = imported.filter(r => r.studentCardNumber && r.firstName && r.lastName);
        if (validImported.length === 0) {
          alert('لم يتم العثور على أي بيانات طلاب صالحة في ملف Excel. يرجى التأكد من أن الأعمدة تحتوي على: "اللقب / Nom" و "الاسم / Prénom" و "رقم بطاقة الطالب / N° Carte Étudiant"');
          return;
        }

        onImportRegistrations(validImported);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء قراءة ملف Excel. يرجى التحقق من جودة الملف وتنسيقه.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const adminEmail = sessionStorage.getItem('jst_admin_email') || '';
  const isSuperAdmin = adminEmail.toLowerCase().trim() === 'b.gaoui@lagh-univ.dz';

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-4">
      
      {/* Welcome & Management Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 justify-end">
            <span>لوحة تحكم المشرف</span>
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة توجيه طلبة السنة الثانية جذع مشترك ومراقبة الرغبات والتحليلات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isSuperAdmin && (
            <>
              <button
                onClick={onResetToMockData}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-150 text-xs font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>إعادة تحميل البيانات التجريبية</span>
              </button>
              
              <button
                onClick={onClearAll}
                disabled={totalCount === 0}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition duration-150 ${
                  totalCount > 0 
                    ? 'border border-red-200 hover:bg-red-50 text-red-600 dark:border-red-900/50 dark:hover:bg-red-950/20' 
                    : 'border border-slate-100 text-slate-300 dark:border-slate-800 dark:text-slate-700 cursor-not-allowed'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>مسح الكل</span>
              </button>
            </>
          )}

          {!isSuperAdmin && (
            <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30 flex items-center gap-1.5 font-bold" dir="rtl">
              <span>⚠️ تعديل ومسح البيانات متاح حصرياً للأستاذ ب. غاوي فقط</span>
            </div>
          )}

          {/* Import Excel */}
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
            className="hidden"
            id="excel-import-file-input"
          />
          <label
            htmlFor="excel-import-file-input"
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-150 text-xs font-semibold cursor-pointer shadow-sm bg-white dark:bg-slate-900"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>استيراد من Excel / Importer Excel</span>
          </label>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            disabled={totalCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition duration-150 shadow-sm cursor-pointer ${
              totalCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>تصدير وتنزيل Excel / Exporter Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Registrations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">إجمالي المسجلين</span>
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 block">{totalCount}</span>
            <span className="text-[10px] text-slate-400">Total Inscriptions</span>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Group A Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">فوج أ / Groupe A</span>
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 block">
              {groupStats.A} <span className="text-sm font-semibold text-slate-400">({getPercentage(groupStats.A)}%)</span>
            </span>
            <span className="text-[10px] text-slate-400">Electronique, Energie, ...</span>
          </div>
          <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Group B Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">فوج ب / Groupe B</span>
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 block">
              {groupStats.B} <span className="text-sm font-semibold text-slate-400">({getPercentage(groupStats.B)}%)</span>
            </span>
            <span className="text-[10px] text-slate-400">Mécanique, Civil, Clim...</span>
          </div>
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Group C Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold block">فوج ج / Groupe C</span>
            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 block">
              {groupStats.C} <span className="text-sm font-semibold text-slate-400">({getPercentage(groupStats.C)}%)</span>
            </span>
            <span className="text-[10px] text-slate-400">Procédés, Mines, Env...</span>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Award className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Chart - Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-right border-b pb-3 border-slate-100 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 justify-end">
              <span>توزيع الاختيارات حسب الأفواج الكبرى</span>
              <TrendingUp className="h-4.5 w-4.5 text-emerald-600" />
            </h3>
            <p className="text-[10px] text-slate-400">Distribution relative des inscriptions par groupe</p>
          </div>

          {totalCount === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              لا توجد بيانات كافية لعرض المخطط البياني.
            </div>
          ) : (
            <div className="space-y-6 py-2">
              {/* Group A Bar */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 font-medium">{groupStats.A} طلاب ({getPercentage(groupStats.A)}%)</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Groupe A (الإلكترونيات والكهرباء)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" 
                    style={{ width: `${getPercentage(groupStats.A)}%` }}
                  />
                </div>
              </div>

              {/* Group B Bar */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 font-medium">{groupStats.B} طلاب ({getPercentage(groupStats.B)}%)</span>
                  <span className="font-bold text-blue-700 dark:text-blue-400">Groupe B (الميكانيك والبناء والطيران)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-l from-blue-500 to-indigo-400 rounded-full transition-all duration-1000" 
                    style={{ width: `${getPercentage(groupStats.B)}%` }}
                  />
                </div>
              </div>

              {/* Group C Bar */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-slate-500 font-medium">{groupStats.C} طلاب ({getPercentage(groupStats.C)}%)</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400">Groupe C (الكيمياء والمناجم والبيئة)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-l from-amber-500 to-orange-400 rounded-full transition-all duration-1000" 
                    style={{ width: `${getPercentage(groupStats.C)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trigonometric Circle representation of groups - الدائرة المثلثية للأفواج */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="text-right border-b pb-3 border-slate-100 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 justify-end">
              <span>الدائرة المثلثية لتوزيع الأفواج</span>
              <PieChart className="h-4.5 w-4.5 text-indigo-600" />
            </h3>
            <p className="text-[10px] text-slate-400">Représentation circulaire trigonométrique des vœux</p>
          </div>

          {totalCount === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
              لا توجد بيانات كافية لرسم الدائرة.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90 origin-center">
                  {/* Background base circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={rad}
                    fill="transparent"
                    stroke="rgba(226, 232, 240, 0.4)"
                    strokeWidth="12"
                  />
                  
                  {/* Segment A - Emerald */}
                  {lenA > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={rad}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth={hoveredSegment === 'A' ? 18 : 12}
                      strokeDasharray={`${lenA} ${circum}`}
                      strokeDashoffset={offsetA}
                      className="transition-all duration-300 ease-out cursor-pointer"
                      onMouseEnter={() => setHoveredSegment('A')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )}

                  {/* Segment B - Blue */}
                  {lenB > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={rad}
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth={hoveredSegment === 'B' ? 18 : 12}
                      strokeDasharray={`${lenB} ${circum}`}
                      strokeDashoffset={offsetB}
                      className="transition-all duration-300 ease-out cursor-pointer"
                      onMouseEnter={() => setHoveredSegment('B')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )}

                  {/* Segment C - Amber */}
                  {lenC > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={rad}
                      fill="transparent"
                      stroke="#f59e0b"
                      strokeWidth={hoveredSegment === 'C' ? 18 : 12}
                      strokeDasharray={`${lenC} ${circum}`}
                      strokeDashoffset={offsetC}
                      className="transition-all duration-300 ease-out cursor-pointer"
                      onMouseEnter={() => setHoveredSegment('C')}
                      onMouseLeave={() => setHoveredSegment(null)}
                    />
                  )}
                </svg>

                {/* Inside circle information */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  {hoveredSegment ? (
                    <div className="animate-fade-in">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">الفوج {hoveredSegment}</span>
                      <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                        {hoveredSegment === 'A' ? groupStats.A : hoveredSegment === 'B' ? groupStats.B : groupStats.C} طالب
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono">
                        {getPercentage(hoveredSegment === 'A' ? groupStats.A : hoveredSegment === 'B' ? groupStats.B : groupStats.C)}%
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">إجمالي الطلبة</span>
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100 font-mono">{totalCount}</span>
                      <span className="text-[8px] text-slate-400 block">Etudiants</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legends with hover effect indicator */}
              <div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold">
                <span 
                  onMouseEnter={() => setHoveredSegment('A')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition cursor-pointer ${hoveredSegment === 'A' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span>الفوج A ({getPercentage(groupStats.A)}%)</span>
                </span>
                <span 
                  onMouseEnter={() => setHoveredSegment('B')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition cursor-pointer ${hoveredSegment === 'B' ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span>الفوج B ({getPercentage(groupStats.B)}%)</span>
                </span>
                <span 
                  onMouseEnter={() => setHoveredSegment('C')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition cursor-pointer ${hoveredSegment === 'C' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' : 'text-slate-600 dark:text-slate-400'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span>الفوج C ({getPercentage(groupStats.C)}%)</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ranked Group Statistics (Replaces Specialty list) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="text-right border-b pb-3 border-slate-100 dark:border-slate-800/60">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 justify-end">
              <span>نسبة اختيار المجموعات كرغبة أولى</span>
              <Award className="h-4.5 w-4.5 text-indigo-600" />
            </h3>
            <p className="text-[10px] text-slate-400">Pourcentage des groupes choisis en 1ère option</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20">
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {groupStats.A} طلاب ({getPercentage(groupStats.A)}%)
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">الفوج A</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20">
              <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                {groupStats.B} طلاب ({getPercentage(groupStats.B)}%)
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">الفوج B</span>
            </div>

            <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                {groupStats.C} طلاب ({getPercentage(groupStats.C)}%)
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans">الفوج C</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Registrations List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filters header */}
        <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-right w-full md:w-auto">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">قائمة تسجيلات الطلاب المودعة</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Filtres et recherche des inscriptions</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end">
            
            {/* Search Input */}
            <div className="relative rounded-xl w-full sm:w-64">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم البطاقة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full text-xs text-right rounded-xl pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white"
                dir="rtl"
              />
            </div>

            {/* Group Filter */}
            <div className="relative rounded-xl min-w-[120px]">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="block w-full text-xs text-right pr-9 pl-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                dir="rtl"
              >
                <option value="all">كل الأفواج</option>
                <option value="A">Groupe A</option>
                <option value="B">Groupe B</option>
                <option value="C">Groupe C</option>
              </select>
            </div>

          </div>
        </div>

        {/* Real Table */}
        <div className="overflow-x-auto">
          {filteredRegistrations.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold">لم يتم العثور على أي تسجيلات مطابقة لمعايير البحث</p>
              <p className="text-[10px] text-slate-400">Aucun étudiant trouvé</p>
            </div>
          ) : (
            <table className="w-full text-sm text-right text-slate-700 dark:text-slate-300">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th scope="col" className="px-6 py-3">رقم البطاقة / N° Carte</th>
                  <th scope="col" className="px-6 py-3 text-right">الاسم الكامل / Étudiant</th>
                  <th scope="col" className="px-6 py-3 text-right">تخصص السنة الأولى / Spécialité 1ère Année</th>
                  <th scope="col" className="px-6 py-3">تاريخ الميلاد / Naissance</th>
                  <th scope="col" className="px-6 py-3">ترتيب الرغبات / Ordre des Vœux</th>
                  <th scope="col" className="px-6 py-3">تاريخ الإيداع / Date</th>
                  <th scope="col" className="px-6 py-3 text-center">عمليات / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRegistrations.map((reg) => {
                  const primaryGroup = reg.rankedGroups && reg.rankedGroups[0];
                  
                  let badgeColor = primaryGroup === 'A' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : primaryGroup === 'B' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400';

                  const rankedString = reg.rankedGroups ? reg.rankedGroups.join(' ➔ ') : '—';

                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition duration-150">
                      <td className="px-6 py-4 font-mono font-medium text-xs text-slate-800 dark:text-slate-200">
                        {reg.studentCardNumber}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 text-right">
                        {reg.lastName} {reg.firstName}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 text-right">
                        {reg.firstYearSpecialty || '—'}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {reg.dateOfBirth}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black tracking-wider ${badgeColor}`}>
                          {rankedString}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-400 font-mono">
                        {new Date(reg.registrationDate).toLocaleDateString('ar-DZ')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => onDeleteRegistration(reg.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition duration-150 cursor-pointer animate-pulse"
                            title="حذف التسجيل"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-700 font-bold select-none" title="صلاحية الحذف مخصصة للأستاذ ب. غاوي فقط">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
