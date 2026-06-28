import React, { useState, useEffect } from 'react';
import { StudentRegistration } from './types';
import { MOCK_REGISTRATIONS } from './data';
import RegistrationForm from './components/RegistrationForm';
import RegistrationReceipt from './components/RegistrationReceipt';
import AdminDashboard from './components/AdminDashboard';
import { GraduationCap, Users, User, Settings, Sparkles, LayoutDashboard, FileCheck, CheckCircle, Info, Lock, LogOut, KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './lib/firebase';

export default function App() {
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([]);
  const [currentView, setCurrentView] = useState<'student-form' | 'student-receipt' | 'admin'>('student-form');
  const [activeRegistration, setActiveRegistration] = useState<StudentRegistration | null>(null);

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem('jst_admin_logged_in') === 'true';
  });
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Click counter for secret admin access (5 clicks required)
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Reset click count after 2 seconds of inactivity
  useEffect(() => {
    if (logoClickCount > 0) {
      const timer = setTimeout(() => {
        setLogoClickCount(0);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [logoClickCount]);

  const handleLogoClick = () => {
    setLogoClickCount(prev => {
      const nextCount = prev + 1;
      if (nextCount >= 5) {
        setShowAdminLogin(true);
        setLoginError('');
        return 0;
      }
      return nextCount;
    });
  };

  // Keyboard shortcut listener (Ctrl + Shift + A) to trigger admin login secretly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdminLogin(prev => !prev);
        setLoginError('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Admin Login verification function
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPassword = adminPassword.trim();

    const allowedEmails = ['admin@lagh-univ.dz', 'b.gaoui@lagh-univ.dz'];
    const allowedPasswords = ['laghouat2026'];

    if (allowedEmails.includes(cleanEmail) && allowedPasswords.includes(cleanPassword)) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem('jst_admin_logged_in', 'true');
      sessionStorage.setItem('jst_admin_email', cleanEmail);
      setShowAdminLogin(false);
      setAdminEmail('');
      setAdminPassword('');
      setLoginError('');
      setCurrentView('admin');
    } else {
      setLoginError('البريد الإلكتروني أو كلمة المرور غير صحيحة! / Email ou mot de passe incorrect !');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem('jst_admin_logged_in');
    sessionStorage.removeItem('jst_admin_email');
    setCurrentView('student-form');
  };

  // Real-time Firestore synchronization on mount
  useEffect(() => {
    const registrationsRef = collection(db, 'registrations');
    const unsubscribe = onSnapshot(registrationsRef, (snapshot) => {
      const list: StudentRegistration[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as StudentRegistration);
      });
      // Sort by registrationDate descending (newest first)
      list.sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
      
      if (list.length > 0) {
        setRegistrations(list);
        localStorage.setItem('jst_engineering_registrations', JSON.stringify(list));
      } else {
        // Database is fresh, let's load & write mock registrations to Cloud Firestore
        setRegistrations(MOCK_REGISTRATIONS);
        localStorage.setItem('jst_engineering_registrations', JSON.stringify(MOCK_REGISTRATIONS));
        
        MOCK_REGISTRATIONS.forEach(async (item) => {
          try {
            await setDoc(doc(db, 'registrations', item.id), item);
          } catch (e) {
            console.error("Error seeding mock registration to Firestore", e);
          }
        });
      }
    }, (error) => {
      console.error("Firestore connection/subscription error:", error);
      // fallback to local storage
      const saved = localStorage.getItem('jst_engineering_registrations');
      if (saved) {
        try {
          setRegistrations(JSON.parse(saved));
        } catch (e) {
          setRegistrations(MOCK_REGISTRATIONS);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Save to local storage whenever registrations state changes as local backup
  const saveRegistrations = (updatedList: StudentRegistration[]) => {
    setRegistrations(updatedList);
    localStorage.setItem('jst_engineering_registrations', JSON.stringify(updatedList));
  };

  // Add a new or update an existing registration in Firestore
  const handleRegisterComplete = async (newReg: StudentRegistration) => {
    const existing = registrations.find(
      r => r.studentCardNumber.trim().toLowerCase() === newReg.studentCardNumber.trim().toLowerCase()
    );
    
    // Maintain same ID if existing, otherwise create new Firestore doc ID or use newReg.id
    const docId = existing ? existing.id : (newReg.id || doc(collection(db, 'registrations')).id);
    const completeReg: StudentRegistration = {
      ...newReg,
      id: docId,
      registrationDate: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'registrations', docId), completeReg);
      setActiveRegistration(completeReg);
      setCurrentView('student-receipt');
    } catch (error) {
      console.error("Error writing registration to Firestore:", error);
      alert("حدث خطأ أثناء حفظ التسجيل في قاعدة البيانات السحابية. الرجاء المحاولة مجدداً / Une erreur est survenue lors de l'enregistrement.");
    }
  };

  // Delete a single registration from admin panel - Restricted to b.gaoui@lagh-univ.dz
  const handleDeleteRegistration = async (id: string) => {
    const loggedInAdminEmail = sessionStorage.getItem('jst_admin_email') || '';
    if (loggedInAdminEmail.toLowerCase().trim() !== 'b.gaoui@lagh-univ.dz') {
      alert('خطأ: أنت لا تملك صلاحية الحذف! هذا الإجراء مخصص وحصري للأستاذ ب. غاوي فقط. / Seul M. B. Gaoui est autorisé à supprimer !');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا التسجيل؟ / Voulez-vous vraiment supprimer cette inscription ?')) {
      try {
        await deleteDoc(doc(db, 'registrations', id));
        if (activeRegistration && activeRegistration.id === id) {
          setActiveRegistration(null);
          setCurrentView('student-form');
        }
      } catch (error) {
        console.error("Error deleting registration:", error);
        alert("فشل حذف التسجيل من قاعدة البيانات السحابية.");
      }
    }
  };

  // Clear all registrations - Restricted to b.gaoui@lagh-univ.dz
  const handleClearAll = async () => {
    const loggedInAdminEmail = sessionStorage.getItem('jst_admin_email') || '';
    if (loggedInAdminEmail.toLowerCase().trim() !== 'b.gaoui@lagh-univ.dz') {
      alert('خطأ: أنت لا تملك صلاحية مسح جميع البيانات! / Seul M. B. Gaoui est autorisé à tout effacer !');
      return;
    }

    if (window.confirm('تحذير هام جداً: هل تريد مسح جميع التسجيلات نهائياً من قاعدة البيانات السحابية؟ / Voulez-vous supprimer TOUTES les inscriptions ?')) {
      try {
        const registrationsRef = collection(db, 'registrations');
        const snapshot = await getDocs(registrationsRef);
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        
        setActiveRegistration(null);
        setCurrentView('student-form');
      } catch (error) {
        console.error("Error clearing collection:", error);
        alert("فشل مسح البيانات من الخادم السحابي.");
      }
    }
  };

  // Import registrations from Excel and save to Firestore
  const handleImportRegistrations = async (imported: StudentRegistration[]) => {
    const existingCards = new Set(registrations.map(r => r.studentCardNumber));
    const filteredNew = imported.filter(r => !existingCards.has(r.studentCardNumber));
    
    if (filteredNew.length === 0) {
      alert('جميع الطلبة في الملف مسجلون بالفعل! / Tous les étudiants dans le fichier sont déjà inscrits !');
      return;
    }
    
    try {
      const savePromises = filteredNew.map(r => {
        const docId = r.id || doc(collection(db, 'registrations')).id;
        const completeReg: StudentRegistration = {
          ...r,
          id: docId,
          registrationDate: r.registrationDate || new Date().toISOString()
        };
        return setDoc(doc(db, 'registrations', docId), completeReg);
      });
      await Promise.all(savePromises);
      alert(`تم استيراد ${filteredNew.length} طالب بنجاح وحفظهم سحابياً! / ${filteredNew.length} étudiants importés et sauvegardés avec succès !`);
    } catch (error) {
      console.error("Error importing to Firestore:", error);
      alert("حدث خطأ أثناء استيراد البيانات لقاعدة البيانات السحابية.");
    }
  };

  // Reset/reload mock data in Firestore - Restricted to b.gaoui@lagh-univ.dz
  const handleResetToMockData = async () => {
    const loggedInAdminEmail = sessionStorage.getItem('jst_admin_email') || '';
    if (loggedInAdminEmail.toLowerCase().trim() !== 'b.gaoui@lagh-univ.dz') {
      alert('خطأ: أنت لا تملك صلاحية إعادة التعيين! / Action réservée à M. B. Gaoui !');
      return;
    }

    if (window.confirm('هل تريد إعادة تعيين وحذف جميع البيانات الحالية وتنزيل البيانات التجريبية الافتراضية؟ / Voulez-vous recharger les données de dẻmonstration ?')) {
      try {
        const registrationsRef = collection(db, 'registrations');
        const snapshot = await getDocs(registrationsRef);
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
        await Promise.all(deletePromises);
        
        const savePromises = MOCK_REGISTRATIONS.map(item => setDoc(doc(db, 'registrations', item.id), item));
        await Promise.all(savePromises);
        
        setActiveRegistration(null);
        setCurrentView('student-form');
      } catch (error) {
        console.error("Error resetting data in Firestore:", error);
        alert("حدث خطأ أثناء إعادة تحميل البيانات التجريبية.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sleek Interface Sidebar */}
      <aside className="w-full lg:w-80 bg-indigo-950 text-white flex flex-col p-6 lg:p-8 shadow-2xl shrink-0 border-b lg:border-b-0 lg:border-r border-indigo-900/40 print:hidden justify-between">
        <div className="space-y-8 lg:space-y-10">
          
          {/* Brand logo & header - Click 5 times to trigger secret admin login */}
          <div 
            className="flex items-center gap-4 lg:block select-none cursor-pointer group" 
            onClick={handleLogoClick}
            title="انقر 5 مرات للدخول السري للمشرف / Cliquez 5 fois pour accès admin"
          >
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center mb-0 lg:mb-4 shrink-0 shadow-lg shadow-indigo-950/55 border border-white/10 group-hover:bg-white/20 transition-colors">
              <GraduationCap className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-sm lg:text-base font-black tracking-tight font-sans">جامعة عمار ثليجي بالأغواط</h1>
              <p className="text-indigo-300 text-[10px] uppercase tracking-widest mt-0.5">فرع المهندسين ST-ING</p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav className="flex flex-row lg:flex-col gap-4 lg:gap-6 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            
            {/* Step 1 button */}
            <button
              onClick={() => {
                if (currentView !== 'student-form') {
                  setCurrentView('student-form');
                }
              }}
              className={`flex items-center gap-3.5 text-right cursor-pointer shrink-0 transition-all ${
                currentView === 'student-form' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentView === 'student-form' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-105' 
                  : 'border border-white/20'
              }`}>
                01
              </span>
              <div className="text-right">
                <p className="text-xs font-bold leading-none">تعبئة البيانات / Identification</p>
                <p className="mt-1 text-[10px] opacity-80">المعلومات الشخصية لطالب</p>
              </div>
            </button>

            {/* Step 2 button (disabled if no active registration) */}
            <button
              onClick={() => {
                if (activeRegistration) {
                  setCurrentView('student-receipt');
                } else {
                  alert('الرجاء تعبئة وتأكيد الاستمارة أولاً / Veuillez d’abord remplir le formulaire');
                }
              }}
              className={`flex items-center gap-3.5 text-right shrink-0 transition-all ${
                currentView === 'student-receipt' ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                currentView === 'student-receipt' 
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/50 scale-105' 
                  : 'border border-white/20'
              }`}>
                02
              </span>
              <div className="text-right">
                <p className="text-xs font-bold leading-none">وصل الرغبة / Reçu d'Orientation</p>
                <p className="mt-1 text-[10px] opacity-80">تحميل وطباعة وصل التسجيل</p>
              </div>
            </button>

            {/* Admin Dashboard - ONLY VISIBLE IF LOGGED IN */}
            {isAdminLoggedIn && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-3.5 text-right shrink-0 transition-all ${
                  currentView === 'admin' ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  currentView === 'admin' 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/50 scale-105' 
                    : 'border border-white/20 hover:border-white/40'
                }`}>
                  <Settings className="h-3.5 w-3.5" />
                </span>
                <div className="text-right">
                  <p className="text-xs font-bold leading-none text-emerald-300">لوحة التحكم / Espace Admin</p>
                  <p className="mt-1 text-[10px] opacity-80 text-emerald-400">إدارة ومراقبة التسجيلات</p>
                </div>
              </button>
            )}

            {/* Logout button - ONLY VISIBLE IF LOGGED IN */}
            {isAdminLoggedIn && (
              <button
                onClick={handleAdminLogout}
                className="flex items-center gap-3.5 text-right cursor-pointer shrink-0 transition-all text-red-200/60 hover:text-red-200 mt-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-950/20 text-red-400">
                  <LogOut className="h-3.5 w-3.5" />
                </span>
                <div className="text-right">
                  <p className="text-xs font-bold leading-none">تسجيل الخروج / Déconnexion</p>
                  <p className="mt-1 text-[10px] opacity-70">إنهاء جلسة المشرف</p>
                </div>
              </button>
            )}

          </nav>
        </div>

        {/* Dynamic Footer Information badge in Sidebar - Sparkles can be clicked secretly */}
        <div className="mt-6 lg:mt-auto pt-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
            <div 
              className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/20 text-indigo-200 cursor-pointer select-none group"
              onClick={() => { setShowAdminLogin(true); setLoginError(''); }}
              title="بوابة الدخول للمشرف / Portail Admin"
            >
              <Sparkles className="h-5 w-5 text-indigo-300 group-hover:animate-spin transition-all" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white">السنة الجامعية 2025/2026</p>
              <p className="text-[10px] text-indigo-300">جذع مشترك علوم وتكنولوجيا</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Sleek Top Banner Header */}
        <header className="px-6 lg:px-10 py-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 print:hidden select-none">
          <div 
            className="text-center sm:text-right cursor-pointer group"
            onDoubleClick={() => { setShowAdminLogin(true); setLoginError(''); }}
            title="انقر مرتين للوصول السريع للمشرف / Double-cliquez pour accès admin"
          >
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2 justify-center sm:justify-end">
              <span className="group-hover:text-indigo-600 transition-colors">جامعة عـــــمار ثليجـــــي بــــالأغــــــــــــواط • كليــة التكنـــلــوجــيا</span>
              <GraduationCap className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              فرع المهندسين | Ingenieur en science et technologie (ST-ING)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-950/40 px-3 py-1 text-xs font-bold text-green-700 dark:text-green-300">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1.5 animate-pulse" />
              النظام مفتوح حالياً / Système Ouvert
            </span>
          </div>
        </header>

        {/* Dynamic Views Mounting Area */}
        <div className="flex-1 p-4 lg:p-8">
          
          {currentView === 'student-form' && (
            <RegistrationForm 
              onRegisterComplete={handleRegisterComplete} 
              registrations={registrations}
              onViewReceipt={(reg) => {
                setActiveRegistration(reg);
                setCurrentView('student-receipt');
              }}
            />
          )}

          {currentView === 'student-receipt' && activeRegistration && (
            <RegistrationReceipt
              registration={activeRegistration}
              onReset={() => {
                setActiveRegistration(null);
                setCurrentView('student-form');
              }}
            />
          )}

          {currentView === 'admin' && (
            isAdminLoggedIn ? (
              <AdminDashboard
                registrations={registrations}
                onDeleteRegistration={handleDeleteRegistration}
                onClearAll={handleClearAll}
                onResetToMockData={handleResetToMockData}
                onImportRegistrations={handleImportRegistrations}
              />
            ) : (
              <div className="max-w-md mx-auto my-12 text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-950/40 shadow-xl" dir="rtl">
                <Lock className="h-14 w-14 text-red-500 mx-auto mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">وصول غير مصرح به!</h3>
                <p className="text-xs text-slate-500 mt-2">عذراً، يجب تسجيل الدخول كمشرف للوصول إلى لوحة التحكم.</p>
                <p className="text-[10px] text-slate-400 mt-1">Veuillez vous connecter en tant qu'administrateur.</p>
                <button
                  onClick={() => { setShowAdminLogin(true); setLoginError(''); }}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition duration-200 shadow-md"
                >
                  تسجيل الدخول كمشرف / Se connecter
                </button>
              </div>
            )
          )}

        </div>

        {/* Academic Footer */}
        <footer className="py-6 text-center text-[11px] text-slate-400 dark:text-slate-600 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 print:hidden select-none">
          <p className="font-semibold">جامعة عمار ثليجي بالأغواط - كلية التكنولوجيا - فرع المهندسين ST-ING</p>
          <p className="font-mono mt-0.5 text-[10px]">© 2026 Université Amar Telidji de Laghouat. Tous droits réservés.</p>
        </footer>

      </div>

      {/* ADMIN LOGIN MODAL OVERLAY */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/60 backdrop-blur-md" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setShowAdminLogin(false)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Top Banner Accent */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 px-6 py-6 text-white text-center">
                <div className="inline-flex p-3 bg-white/10 rounded-2xl mb-2.5">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-base font-black">تسجيل دخول المشرف</h3>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest mt-0.5">Connexion Administrateur</p>
              </div>

              {/* Login Form body */}
              <form onSubmit={handleAdminLoginSubmit} className="p-6 md:p-8 space-y-5">
                
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold leading-relaxed"
                  >
                    {loginError}
                  </motion.div>
                )}

                {/* Info block regarding hidden entry */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 leading-normal text-right">
                  هذا المدخل مخصص لإدارة الموقع فقط. الطلاب لا يمكنهم رؤية أو تصفح لوحة التحكم.
                  <span className="block font-mono text-[9px] mt-1 text-slate-400">Ctrl + Shift + A to toggle.</span>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1.5">البريد الإلكتروني / Adresse Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="admin@lagh-univ.dz"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pr-10 pl-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150"
                    />
                    <div className="absolute inset-y-0 pr-3 right-0 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-350 mb-1.5">الرمز السري / Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pr-10 pl-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150"
                    />
                    <div className="absolute inset-y-0 pr-3 right-0 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 pl-3 left-0 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/15 hover:shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>دخول لوحة التحكم / Se connecter</span>
                </button>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
