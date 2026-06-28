import { useState, FormEvent } from 'react';
import { StudentRegistration, GroupDefinition } from '../types';
import { GROUPS_DATA } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { User, IdCard, Calendar, Award, ArrowRight, ArrowLeft, ChevronRight, Check, CheckCircle2, GraduationCap, AlertCircle, ArrowUp, ArrowDown, Lock, Search, ShieldCheck, Printer, Edit, RefreshCw } from 'lucide-react';

interface RegistrationFormProps {
  onRegisterComplete: (registration: StudentRegistration) => void;
  registrations: StudentRegistration[];
  onViewReceipt: (registration: StudentRegistration) => void;
}

export default function RegistrationForm({ onRegisterComplete, registrations = [], onViewReceipt }: RegistrationFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'register' | 'verify'>('register');
  
  // Verification states
  const [searchCardNumber, setSearchCardNumber] = useState('');
  const [verifiedStudent, setVerifiedStudent] = useState<StudentRegistration | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  
  // Duplicate Tracking State
  const [duplicateStudent, setDuplicateStudent] = useState<StudentRegistration | null>(null);
  const [hasConfirmedDuplicateAction, setHasConfirmedDuplicateAction] = useState(false);
  
  // Phase 1 Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [studentCardNumber, setStudentCardNumber] = useState('');
  const [firstYearSpecialty, setFirstYearSpecialty] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Phase 2 Selection State
  const [rankedGroups, setRankedGroups] = useState<('A' | 'B' | 'C')[]>(['A', 'B', 'C']);

  // Helper to determine if a group is locked to top based on 1st Year Specialty
  const getRequiredGroup = (specType: string): 'A' | 'B' | 'C' | null => {
    if (specType === 'Génie Electrique') return 'A';
    if (specType === 'Génie Civil' || specType === 'Génie Mécanique') return 'B';
    if (specType === 'Génie des Procédés') return 'C';
    return null;
  };

  const handleSpecialtyChange = (type: string) => {
    setFirstYearSpecialty(type);
    const required = getRequiredGroup(type);
    if (required) {
      const remaining = ['A', 'B', 'C'].filter(g => g !== required) as ('A' | 'B' | 'C')[];
      setRankedGroups([required, ...remaining]);
    }
    if (errors.firstYearSpecialty) {
      const newErrors = { ...errors };
      delete newErrors.firstYearSpecialty;
      setErrors(newErrors);
    }
  };

  const handleVerifySearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const query = searchCardNumber.trim().toLowerCase();
    if (!query) {
      setVerifyError('الرجاء إدخال رقم بطاقة الطالب للبحث / Veuillez saisir le numéro de carte');
      setVerifiedStudent(null);
      setHasSearched(false);
      return;
    }
    
    setVerifyError('');
    const found = registrations.find(
      r => r.studentCardNumber.trim().toLowerCase() === query
    );
    
    if (found) {
      setVerifiedStudent(found);
    } else {
      setVerifiedStudent(null);
    }
    setHasSearched(true);
  };

  // Validation for Step 1
  const validateStep1 = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'الرجاء إدخال الاسم الأول / Veuillez saisir le prénom';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'الرجاء إدخال اللقب / Veuillez saisir le nom';
    }
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'الرجاء اختيار تاريخ الميلاد / Veuillez choisir la date de naissance';
    } else {
      const yearPart = dateOfBirth.split('-')[0];
      const birthYear = parseInt(yearPart, 10);
      const currentYear = new Date().getFullYear();
      if (yearPart.length !== 4 || isNaN(birthYear)) {
        newErrors.dateOfBirth = 'السنة يجب أن تتكون من 4 أرقام فقط (مثال: 2004) / L\'année doit comporter exactement 4 chiffres';
      } else if (birthYear > currentYear - 15 || birthYear < currentYear - 60) {
        newErrors.dateOfBirth = 'تاريخ ميلاد غير منطقي لطالب جامعي / Date de naissance non valide';
      }
    }
    
    if (!studentCardNumber.trim()) {
      newErrors.studentCardNumber = 'الرجاء إدخال رقم بطاقة الطالب / Veuillez saisir le numéro de carte d’étudiant';
    } else if (!/^[0-9a-zA-Z-\/]{6,20}$/.test(studentCardNumber)) {
      newErrors.studentCardNumber = 'رقم البطاقة يجب أن يتكون من 6 إلى 20 رمزاً / Le numéro de carte doit contenir entre 6 et 20 caractères';
    }

    if (!firstYearSpecialty) {
      newErrors.firstYearSpecialty = 'الرجاء اختيار تخصص السنة الأولى / Veuillez choisir votre spécialité de 1ère année';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      const existing = registrations.find(
        r => r.studentCardNumber.trim().toLowerCase() === studentCardNumber.trim().toLowerCase()
      );
      if (existing && !hasConfirmedDuplicateAction) {
        setDuplicateStudent(existing);
        return;
      }
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const required = getRequiredGroup(firstYearSpecialty);
    if (required && index === 1) return; // Can't swap into locked index 0
    const newGroups = [...rankedGroups];
    const temp = newGroups[index];
    newGroups[index] = newGroups[index - 1];
    newGroups[index - 1] = temp;
    setRankedGroups(newGroups);
  };

  const handleMoveDown = (index: number) => {
    if (index === rankedGroups.length - 1) return;
    const required = getRequiredGroup(firstYearSpecialty);
    if (required && index === 0) return; // Can't swap out of locked index 0
    const newGroups = [...rankedGroups];
    const temp = newGroups[index];
    newGroups[index] = newGroups[index + 1];
    newGroups[index + 1] = temp;
    setRankedGroups(newGroups);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) {
      setStep(1);
      return;
    }

    const existing = registrations.find(
      r => r.studentCardNumber.trim().toLowerCase() === studentCardNumber.trim().toLowerCase()
    );
    if (existing && !hasConfirmedDuplicateAction) {
      setDuplicateStudent(existing);
      setStep(1);
      return;
    }

    if (rankedGroups.length < 3) {
      setErrors({
        selection: 'الرجاء ترتيب المجموعات الثلاث بالكامل (الرغبة 1، 2، 3) / Veuillez classer les 3 groupes'
      });
      return;
    }

    const newRegistration: StudentRegistration = {
      id: existing ? existing.id : ('reg_' + Math.random().toString(36).substring(2, 11)),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      studentCardNumber: studentCardNumber.trim(),
      firstYearSpecialty,
      rankedGroups: rankedGroups,
      registrationDate: new Date().toISOString()
    };

    onRegisterComplete(newRegistration);
  };

  // Find the selected group details (first choice group)
  const selectedGroupId = rankedGroups[0] || null;
  const selectedGroup = GROUPS_DATA.find(g => g.id === selectedGroupId);

  const formatDateTime = (dateStr: string) => {
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

  if (duplicateStudent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-amber-200 dark:border-amber-900/40 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-6 text-white text-center">
            <div className="inline-flex p-3 bg-white/20 rounded-full mb-3">
              <AlertCircle className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold font-sans">هذا الطالب مسجل مسبقاً في البوابة!</h2>
            <p className="text-amber-100 mt-1.5 text-xs font-semibold">
              Cet étudiant est déjà inscrit dans le portail d'orientation.
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-xl border border-amber-100/30 text-right text-slate-700 dark:text-slate-300">
              <p className="text-xs leading-relaxed font-semibold">
                لقد تم اكتشاف تسجيل مسبق في قاعدة البيانات يحمل نفس **رقم بطاقة الطالب ({duplicateStudent.studentCardNumber})**. يرجى مراجعة تفاصيل التسجيل أدناه لتأكيد الإجراء المناسب.
              </p>
            </div>

            {/* Info details card */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-150 dark:border-slate-800 text-right space-y-4">
              <h3 className="text-xs font-bold text-slate-450 border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between">
                <span>تفاصيل آخر تسجيل تم إيداعه:</span>
                <span className="font-mono">Détails du dernier enregistrement</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">الاسم واللقب:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {duplicateStudent.lastName} {duplicateStudent.firstName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">رقم بطاقة الطالب:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {duplicateStudent.studentCardNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">تاريخ الميلاد:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {duplicateStudent.dateOfBirth}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">تخصص السنة الأولى:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {duplicateStudent.firstYearSpecialty || '—'}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 block mb-1 font-semibold">ترتيب الرغبات المسجل:</span>
                  <div className="flex gap-2 mt-1">
                    {duplicateStudent.rankedGroups.map((groupId, index) => {
                      const grp = GROUPS_DATA.find(g => g.id === groupId);
                      return (
                        <div key={groupId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg text-center flex-1">
                          <span className="block text-[9px] font-bold text-slate-400">الرغبة {index + 1}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold mt-1 ${grp?.badgeBg}`}>
                            {grp?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1">
                  <span className="text-slate-400 block font-semibold">تاريخ التسجيل الإلكتروني:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatDateTime(duplicateStudent.registrationDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning decision buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setStudentCardNumber('');
                  setDuplicateStudent(null);
                  setHasConfirmedDuplicateAction(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-200 text-xs font-bold cursor-pointer"
              >
                <ArrowRight className="h-4 w-4 text-slate-500" />
                <span>العودة للقائمة الرئيسية / Retour</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFirstName(duplicateStudent.firstName);
                  setLastName(duplicateStudent.lastName);
                  setDateOfBirth(duplicateStudent.dateOfBirth);
                  setFirstYearSpecialty(duplicateStudent.firstYearSpecialty);
                  setRankedGroups(duplicateStudent.rankedGroups);
                  
                  setHasConfirmedDuplicateAction(true);
                  setDuplicateStudent(null);
                  setStep(2);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition duration-200 text-xs font-bold cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>متابعة تغيير الرغبات / Modifier les vœux</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" dir="rtl">
      
      {/* Beautiful Custom Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl mb-8 max-w-md mx-auto border border-slate-200/50 dark:border-slate-800/40 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setActiveTab('register');
            setVerifyError('');
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'register'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-150 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>تسجيل رغبات جديد / S'inscrire</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('verify');
            setVerifyError('');
            setSearchCardNumber('');
            setVerifiedStudent(null);
            setHasSearched(false);
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'verify'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-150 dark:border-slate-800'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>التحقق من التسجيل / Vérifier</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'verify' ? (
          <motion.div
            key="verifyTab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Main verification card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
              {/* Card Header Banner */}
              <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 px-6 py-5 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-base sm:text-lg font-bold font-sans tracking-tight">التحقق من التسجيل وتفاصيل التوجيه</h2>
                  <p className="text-xs text-indigo-200 mt-1">Vérification de l'inscription et détails d'orientation</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-indigo-300 shrink-0" />
              </div>

              {/* Verification Form Body */}
              <div className="p-6 sm:p-8 space-y-6">
                <form onSubmit={handleVerifySearch} className="space-y-4 max-w-lg mx-auto">
                  <div className="text-right">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      الرجاء إدخال رقم بطاقة الطالب للتحقق من التسجيل:
                    </label>
                    <p className="text-[10px] text-slate-400 mb-3">Veuillez saisir le numéro de votre carte d'étudiant pour afficher vos vœux</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        placeholder="مثال: 181839012345 أو 232339567890"
                        value={searchCardNumber}
                        onChange={(e) => setSearchCardNumber(e.target.value)}
                        className="w-full pr-10 pl-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150 text-right"
                      />
                      <div className="absolute inset-y-0 pr-3 right-0 flex items-center pointer-events-none text-slate-400">
                        <IdCard className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer shrink-0"
                    >
                      <Search className="h-4 w-4" />
                      <span>بحث وتحقق / Rechercher</span>
                    </button>
                  </div>

                  {verifyError && (
                    <p className="text-xs text-red-500 font-semibold text-right">{verifyError}</p>
                  )}
                </form>

                {/* SEARCH RESULTS PANEL */}
                <AnimatePresence mode="wait">
                  {hasSearched && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-6"
                    >
                      {verifiedStudent ? (
                        <div className="space-y-6 max-w-2xl mx-auto">
                          {/* Success header */}
                          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-4 flex items-center gap-3.5" dir="rtl">
                            <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div className="text-right flex-1">
                              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">تم العثور على التسجيل بنجاح!</h4>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-500">Inscription trouvée avec succès dans la base de données.</p>
                            </div>
                          </div>

                          {/* Student Details Grid */}
                          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-6 text-right space-y-4">
                            <h3 className="text-xs font-bold text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-2 flex justify-between">
                              <span>المعلومات الشخصية للطالب:</span>
                              <span className="font-mono text-slate-400">Informations Personnelles</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 block font-semibold">الاسم الكامل:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  {verifiedStudent.lastName} {verifiedStudent.firstName}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">رقم بطاقة الطالب:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                                  {verifiedStudent.studentCardNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">تاريخ الميلاد:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                  {verifiedStudent.dateOfBirth}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-semibold">تخصص السنة الأولى:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {verifiedStudent.firstYearSpecialty || '—'}
                                </span>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-slate-400 block mb-2 font-semibold">ترتيب الرغبات المسجل:</span>
                                <div className="flex gap-2">
                                  {verifiedStudent.rankedGroups.map((groupId, index) => {
                                    const grp = GROUPS_DATA.find(g => g.id === groupId);
                                    return (
                                      <div key={groupId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-center flex-1">
                                        <span className="block text-[9px] font-bold text-slate-400">الرغبة {index + 1}</span>
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold mt-1.5 ${grp?.badgeBg}`}>
                                          {grp?.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="sm:col-span-2 border-t border-slate-200 dark:border-slate-800 pt-3 mt-1 flex justify-between items-center">
                                <div>
                                  <span className="text-slate-400 block font-semibold">تاريخ التسجيل الإلكتروني:</span>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                                    {formatDateTime(verifiedStudent.registrationDate)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Load into form states to allow modification
                                setFirstName(verifiedStudent.firstName);
                                setLastName(verifiedStudent.lastName);
                                setDateOfBirth(verifiedStudent.dateOfBirth);
                                setStudentCardNumber(verifiedStudent.studentCardNumber);
                                setFirstYearSpecialty(verifiedStudent.firstYearSpecialty);
                                setRankedGroups(verifiedStudent.rankedGroups);
                                
                                setHasConfirmedDuplicateAction(true);
                                setActiveTab('register');
                                setStep(1);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-200 text-xs font-bold cursor-pointer"
                            >
                              <Edit className="h-4 w-4 text-slate-500" />
                              <span>تعديل الرغبات / Modifier les vœux</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onViewReceipt(verifiedStudent)}
                              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition duration-200 text-xs font-bold cursor-pointer"
                            >
                              <Printer className="h-4 w-4" />
                              <span>عرض وتحميل الوصل / Voir le reçu</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 space-y-4 max-w-md mx-auto">
                          <div className="inline-flex p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full">
                            <AlertCircle className="h-8 w-8" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">رقم بطاقة الطالب غير مسجل!</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">لم يتم العثور على أي تسجيل إلكتروني برقم البطاقة المدخل.</p>
                            <p className="text-[10px] text-slate-400">Aucun enregistrement trouvé avec ce numéro de carte.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              // Set student card number automatically and switch to register
                              setStudentCardNumber(searchCardNumber);
                              setActiveTab('register');
                              setStep(1);
                            }}
                            className="mt-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition duration-150"
                          >
                            سجل رغباتك الآن / S'inscrire maintenant
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="registerTab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step Tracker Indicator */}
            <div className="mb-8 relative">
              <div className="flex justify-between items-center max-w-md mx-auto relative z-10">
                
                {/* Step 1 Bubble */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => step === 2 && setStep(1)}
                    disabled={step === 1}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step === 1
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50 scale-110'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer'
                    }`}
                  >
                    {step === 2 ? <Check className="h-5 w-5" /> : '1'}
                  </button>
                  <span className="text-xs font-bold mt-2 text-slate-700 dark:text-slate-300">
                    المعلومات الشخصية
                  </span>
                  <span className="text-[10px] text-slate-400">Phase 1: Infos</span>
                </div>

                {/* Connection Line */}
                <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 mx-4 -mt-6 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-500"
                    style={{ width: step === 2 ? '100%' : '0%' }}
                  />
                </div>

                {/* Step 2 Bubble */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                      step === 2
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50 scale-110'
                        : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                    }`}
                  >
                    '2'
                  </div>
                  <span className="text-xs font-bold mt-2 text-slate-700 dark:text-slate-300">
                    اختيار التخصص
                  </span>
                  <span className="text-[10px] text-slate-400">Phase 2: Spécialité</span>
                </div>

              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
              
              {/* Card Header Banner */}
              <div className="bg-gradient-to-r from-indigo-800 to-indigo-950 px-6 py-5 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold font-sans tracking-tight">
                    {step === 1 ? 'تسجيل المعلومات الشخصية لطالب' : 'ترتيب الرغبات وتحديد التخصص المفضل'}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1">
                    {step === 1 
                      ? 'Saisie des données personnelles de l\'étudiant' 
                      : 'Classement des vœux et sélection de la spécialité'
                    }
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-indigo-300 shrink-0" />
              </div>

              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Critical Administrative Warning */}
                <div className="bg-red-50 dark:bg-red-950/20 border-r-4 border-red-600 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-right flex-1">
                    <p className="text-xs font-black text-red-800 dark:text-red-400">تنبيه هام جداً للأهمية القصوى:</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      أي طالب منتقل إلى السنة الثانية <span className="font-bold underline">((2eme ST-ING مهندسين</span> لا يقرّ رغباته ويرسل الملف المرفق يوجه تلقائياً وبصفة آلية من طرف الإدارة.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* First Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>الاسم الأول *</span>
                      <span className="text-xs text-slate-400 font-normal">Prénom</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (errors.firstName) {
                            const newErrors = { ...errors };
                            delete newErrors.firstName;
                            setErrors(newErrors);
                          }
                        }}
                        placeholder="أدخل الاسم الأول"
                        className={`block w-full rounded-xl pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border transition duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                          errors.firstName
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 focus:border-emerald-500'
                        }`}
                        dir="rtl"
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium" dir="rtl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.firstName}</span>
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>اللقب *</span>
                      <span className="text-xs text-slate-400 font-normal">Nom</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (errors.lastName) {
                            const newErrors = { ...errors };
                            delete newErrors.lastName;
                            setErrors(newErrors);
                          }
                        }}
                        placeholder="أدخل اللقب"
                        className={`block w-full rounded-xl pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 border transition duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                          errors.lastName
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 focus:border-emerald-500'
                        }`}
                        dir="rtl"
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium" dir="rtl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.lastName}</span>
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>تاريخ الميلاد *</span>
                      <span className="text-xs text-slate-400 font-normal">Date de Naissance</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        min="1960-01-01"
                        max="2011-12-31"
                        value={dateOfBirth}
                        onChange={(e) => {
                          let val = e.target.value;
                          if (val) {
                            const parts = val.split('-');
                            if (parts[0] && parts[0].length > 4) {
                              parts[0] = parts[0].slice(0, 4);
                              val = parts.join('-');
                            }
                          }
                          setDateOfBirth(val);
                          if (errors.dateOfBirth) {
                            const newErrors = { ...errors };
                            delete newErrors.dateOfBirth;
                            setErrors(newErrors);
                          }
                        }}
                        className={`block w-full rounded-xl pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border transition duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 ${
                          errors.dateOfBirth
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium" dir="rtl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.dateOfBirth}</span>
                      </p>
                    )}
                  </div>

                  {/* Student Card Number */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>رقم بطاقة الطالب *</span>
                      <span className="text-xs text-slate-400 font-normal">N° Carte d'Étudiant</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <IdCard className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={studentCardNumber}
                        onChange={(e) => {
                          setStudentCardNumber(e.target.value);
                          if (errors.studentCardNumber) {
                            const newErrors = { ...errors };
                            delete newErrors.studentCardNumber;
                            setErrors(newErrors);
                          }
                        }}
                        placeholder="مثال: 222235011223"
                        className={`block w-full rounded-xl pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-slate-100 placeholder-slate-400 border transition duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 font-mono ${
                          errors.studentCardNumber
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 focus:border-emerald-500'
                        }`}
                        dir="ltr"
                      />
                    </div>
                    {errors.studentCardNumber && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium" dir="rtl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.studentCardNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* 1st Year Specialty */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex justify-between">
                      <span>تخصص السنة الأولى *</span>
                      <span className="text-xs text-slate-400 font-normal">Spécialité de 1ère Année</span>
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-5 w-5 text-slate-400" />
                      </div>
                      <select
                        value={firstYearSpecialty}
                        onChange={(e) => handleSpecialtyChange(e.target.value)}
                        className={`block w-full rounded-xl pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border transition duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-slate-900 text-right appearance-none cursor-pointer ${
                          errors.firstYearSpecialty
                            ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-200 dark:focus:ring-emerald-900/50 focus:border-emerald-500'
                        }`}
                        dir="rtl"
                      >
                        <option value="">-- اختر تخصص السنة الأولى / Choisissez la spécialité --</option>
                        <option value="Génie Electrique">هندسة كهربائية (Génie Electrique) ➔ الفوج A</option>
                        <option value="Génie Civil">هندسة مدنية (Génie Civil) ➔ الفوج B</option>
                        <option value="Génie Mécanique">هندسة ميكانيكية (Génie Mécanique) ➔ الفوج B</option>
                        <option value="Génie des Procédés">هندسة الطرائق (Génie des Procédés) ➔ الفوج C</option>
                        <option value="ST-ING جذع مشترك علوم وتكنولوجيا">جذع مشترك علوم وتكنولوجيا (ST-ING) ➔ ترتيب حر</option>
                      </select>
                    </div>
                    {errors.firstYearSpecialty && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1 font-medium justify-end" dir="rtl">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{errors.firstYearSpecialty}</span>
                      </p>
                    )}
                  </div>

                </div>

                {/* Direct Registration Information Panel */}
                <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/30 text-right space-y-2.5" dir="rtl">
                  <h4 className="text-xs font-black text-indigo-950 dark:text-indigo-300 flex items-center gap-1.5 justify-start">
                    <Award className="h-4 w-4 text-indigo-600" />
                    <span>توجيهات التسجيل المعتمدة حسب تخصص السنة الأولى:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <p>طلبة السنة الأولى <span className="font-bold">Génie Electrique</span> ➔ يسجلون مباشرة في <span className="font-bold text-emerald-600">الفوج A</span></p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <p>طلبة السنة الأولى <span className="font-bold">Génie Civil</span> ➔ يسجلون مباشرة في <span className="font-bold text-blue-600">الفوج B</span></p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <p>طلبة السنة الأولى <span className="font-bold">Génie Mécanique</span> ➔ يسجلون مباشرة في <span className="font-bold text-blue-600">الفوج B</span></p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <p>طلبة السنة الأولى <span className="font-bold">Génie des Procédés</span> ➔ يسجلون مباشرة في <span className="font-bold text-amber-600">الفوج C</span></p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-850 p-2 rounded-lg border border-slate-100 dark:border-slate-800 sm:col-span-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <p>طلبة السنة الأولى جذع مشترك علوم وتكنولوجيا <span className="font-bold">ST-ING</span> ➔ يختارون ويرتبون الأفواج <span className="font-bold text-indigo-600">A, B, C بحرية تامة</span></p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/40 dark:bg-emerald-950/10 rounded-2xl p-5 border border-emerald-100/50 dark:border-emerald-900/30 space-y-4 mt-4" dir="rtl">
                  <div className="flex items-center gap-2 justify-start border-b border-emerald-100 dark:border-emerald-900/40 pb-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="text-right">
                      <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-350">نظام التوجيه الموحد للجذع المشترك:</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Système d'Orientation Unifié du Tronçon Commun (ST)</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-slate-700 dark:text-slate-300 text-right">
                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 shadow-sm">
                      <p className="font-bold text-slate-850 dark:text-slate-200">١. الترتيب التنازلي والمعدل السنوي:</p>
                      <p className="text-slate-600 dark:text-slate-405 leading-relaxed">يتم ترتيب الطلبة ترتيباً تنازلياً استناداً إلى معدل الترتيب السنوي للعلوم والتكنولوجيا.</p>
                      <p className="text-[9.5px] text-slate-450 dark:text-slate-500 font-sans italic pt-1.5 border-t border-slate-50 dark:border-slate-850/50" dir="ltr" style={{ textAlign: 'left' }}>
                        Les étudiants sont classés par ordre décroissant sur la base de la moyenne de classement annuelle en Sciences et Technologies (ST).
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 shadow-sm">
                      <p className="font-bold text-slate-850 dark:text-slate-200">٢. الأولوية والاستحقاق المطلق:</p>
                      <p className="text-slate-600 dark:text-slate-405 leading-relaxed">الأولوية في تلبية الرغبات تكون دائماً للطالب الحاصل على المعدل الأعلى (الاستحقاق المطلق).</p>
                      <p className="text-[9.5px] text-slate-450 dark:text-slate-500 font-sans italic pt-1.5 border-t border-slate-50 dark:border-slate-850/50" dir="ltr" style={{ textAlign: 'left' }}>
                        La priorité absolue dans la satisfaction des vœux est attribuée à l'étudiant ayant obtenu la moyenne la plus élevée (le mérite absolu).
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 shadow-sm">
                      <p className="font-bold text-slate-850 dark:text-slate-200">٣. طاقة استيعاب التخصصات:</p>
                      <p className="text-slate-600 dark:text-slate-405 leading-relaxed">كل تخصص (شعبة هندسية) يمتلك طاقة استيعاب محددة من المقاعد تضبطها الإدارة الجامعية سنوياً.</p>
                      <p className="text-[9.5px] text-slate-450 dark:text-slate-500 font-sans italic pt-1.5 border-t border-slate-50 dark:border-slate-850/50" dir="ltr" style={{ textAlign: 'left' }}>
                        Chaque spécialité (filière d'ingénierie) possède une capacité d'accueil limitée fixée annuellement par l'administration universitaire.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 shadow-sm">
                      <p className="font-bold text-slate-850 dark:text-slate-200">٤. التوزيع والتوجيه الآلي التلقائي:</p>
                      <p className="text-slate-600 dark:text-slate-405 leading-relaxed">في حال امتلاء مقاعد الرغبة الأولى للطالب، ينتقل النظام تلقائياً لدراسة رغبته الثانية، ثم الثالثة، وهكذا دواليك.</p>
                      <p className="text-[9.5px] text-slate-450 dark:text-slate-500 font-sans italic pt-1.5 border-t border-slate-50 dark:border-slate-850/50" dir="ltr" style={{ textAlign: 'left' }}>
                        En cas de saturation des places du 1er vœu, le système passe automatiquement à l'examen du 2ème vœu, puis du 3ème, et ainsi de suite.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 transition duration-200 text-sm font-semibold cursor-pointer"
                  >
                    <span>المرحلة التالية: التخصصات / Phase Suivante</span>
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: GROUP & SPECIALTY SELECTION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                
                {/* Critical Administrative Warning */}
                <div className="bg-red-50 dark:bg-red-950/20 border-r-4 border-red-600 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div className="text-right flex-1">
                    <p className="text-xs font-black text-red-800 dark:text-red-400">تنبيه هام جداً للأهمية القصوى:</p>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                      أي طالب منتقل إلى السنة الثانية <span className="font-bold underline">((2eme ST-ING مهندسين</span> لا يقرّ رغباته ويرسل الملف المرفق يوجه تلقائياً وبصفة آلية من طرف الإدارة.
                    </p>
                  </div>
                </div>

                {/* Intro */}
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
                    الرجاء ترتيب رغبات المجموعات الثلاث (Groupe A, B, C) تنازلياً باستخدام الأسهم المرافقة لكل فوج:
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Veuillez classer les trois groupes par ordre de préférence en utilisant les flèches de direction :
                  </p>
                </div>

                {/* Vertical Stack list of Groups with arrow-based ranking */}
                <div className="space-y-4">
                  {rankedGroups.map((groupId, index) => {
                    const group = GROUPS_DATA.find((g) => g.id === groupId)!;
                    const requiredGroup = getRequiredGroup(firstYearSpecialty);
                    const isGroupLocked = requiredGroup !== null && index === 0;

                    let cardBorder = index === 0 
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10'
                      : index === 1
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50/10'
                        : 'border-pink-500 dark:border-pink-400 bg-pink-50/10';

                    let badgeColor = index === 0
                      ? 'bg-indigo-600 text-white'
                      : index === 1
                        ? 'bg-purple-600 text-white'
                        : 'bg-pink-600 text-white';

                    const isUpDisabled = index === 0 || (requiredGroup !== null && index === 1);
                    const isDownDisabled = index === rankedGroups.length - 1 || (requiredGroup !== null && index === 0);

                    return (
                      <div 
                        key={group.id}
                        className={`p-5 bg-white dark:bg-slate-900 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${cardBorder}`}
                      >
                        {/* Right Section: Rank indicator and Group Info */}
                        <div className="flex items-start gap-4 flex-1 w-full text-right" dir="rtl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${badgeColor} shrink-0 shadow-md`}>
                            {index + 1}
                          </div>
                          
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 justify-start flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${group.badgeBg}`}>
                                {group.name}
                              </span>
                              
                              {isGroupLocked && (
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1 bg-indigo-100/60 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/40 shadow-sm" dir="rtl">
                                  <Lock className="h-3 w-3 shrink-0 text-indigo-600" />
                                  <span>توجيه تلقائي (تخصص {firstYearSpecialty})</span>
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1.5 flex justify-between items-center w-full">
                              <span>تخصصات الفوج:</span>
                              <span className="text-[10px] text-slate-400 font-mono">Filières du Groupe :</span>
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-450 leading-relaxed font-semibold">
                              {group.specialties.map(s => `${s.nameAr} (${s.nameFr})`).join('، ')}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/40">
                              <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-normal">
                                {group.descriptionAr}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal font-sans italic" dir="ltr" style={{ textAlign: 'left' }}>
                                {group.descriptionFr}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Left Section: Reordering Arrow Buttons */}
                        <div className="flex md:flex-col items-center gap-2 shrink-0 border-t md:border-t-0 md:border-r border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pr-4 w-full md:w-auto justify-center md:justify-start">
                          <button
                            type="button"
                            onClick={() => handleMoveUp(index)}
                            disabled={isUpDisabled}
                            className={`p-2 rounded-lg border transition duration-150 flex items-center justify-center cursor-pointer ${
                              isUpDisabled
                                ? 'border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/10'
                                : 'border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 shadow-sm'
                            }`}
                            title="ترقية الترتيب / Monter"
                          >
                            <ArrowUp className="h-4.5 w-4.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleMoveDown(index)}
                            disabled={isDownDisabled}
                            className={`p-2 rounded-lg border transition duration-150 flex items-center justify-center cursor-pointer ${
                              isDownDisabled
                                ? 'border-slate-100 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/10'
                                : 'border-indigo-200 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 shadow-sm'
                            }`}
                            title="تنزيل الترتيب / Descendre"
                          >
                            <ArrowDown className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {errors.selection && (
                  <p className="text-xs text-red-500 flex items-center justify-end gap-1 font-medium mt-2" dir="rtl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errors.selection}</span>
                  </p>
                )}

                {/* Footer Controls */}
                <div className="pt-6 border-t border-slate-150 dark:border-slate-800 flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition duration-200 text-sm font-semibold"
                  >
                    <ArrowRight className="h-4 w-4 shrink-0" />
                    <span>السابق / Précédent</span>
                  </button>

                  <button
                    type="submit"
                    disabled={rankedGroups.length < 3}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-md transition duration-200 text-sm font-bold ${
                      rankedGroups.length === 3
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 cursor-pointer'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <span>تأكيد التسجيل وإصدار الوصل / Confirmer</span>
                    <Check className="h-4 w-4 shrink-0" />
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </form>

      </div>
    </motion.div>
  )}
</AnimatePresence>

    </div>
  );
}
