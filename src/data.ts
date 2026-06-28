import { GroupDefinition, StudentRegistration } from './types';

export const GROUPS_DATA: GroupDefinition[] = [
  {
    id: 'A',
    name: 'Groupe A',
    color: 'emerald',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/25 dark:to-teal-950/25',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    textCol: 'text-emerald-700 dark:text-emerald-400',
    descriptionAr: 'يركز على العلوم الكهربائية، الإلكترونيات، الاتصالات، الأنظمة الذكية والطاقة المتجددة.',
    descriptionFr: 'Axé sur les sciences électriques, l’électronique, les télécommunications, les systèmes intelligents et les énergies renouvelables.',
    specialties: [
      {
        id: 'Electronique',
        nameAr: 'إلكترونيك',
        nameFr: 'Électronique',
        descriptionAr: 'دراسة وتصميم وتطوير الدارات والأجهزة الإلكترونية والأنظمة المدمجة.',
        descriptionFr: 'Étude, conception et développement de circuits électroniques, de microprocesseurs et de systèmes embarqués.'
      },
      {
        id: 'Automatique',
        nameAr: 'آلية وضبط',
        nameFr: 'Automatique',
        descriptionAr: 'التحكم الآلي في الأنظمة الصناعية، الروبوتات والذكاء الاصطناعي للمصانع.',
        descriptionFr: 'Contrôle automatique des processus industriels, robotique et automatisation intelligente.'
      },
      {
        id: 'Electromecanique',
        nameAr: 'كهروميكانيك',
        nameFr: 'Électromécanique',
        descriptionAr: 'الدمج بين الهندسة الكهربائية والميكانيكية لتشغيل وصيانة الآلات الصناعية.',
        descriptionFr: 'Sinergie entre le génie électrique et mécanique pour le fonctionnement et la maintenance d’équipements.'
      },
      {
        id: 'Electrotechnique',
        nameAr: 'كهروتقنية',
        nameFr: 'Électrotechnique',
        descriptionAr: 'دراسة توليد ونقل وتوزيع واستخدام الطاقة الكهربائية والآلات القوية.',
        descriptionFr: 'Génération, transport, distribution et utilisation de l’énergie électrique à grande échelle.'
      },
      {
        id: 'Genie Biomedical',
        nameAr: 'هندسة طبية حيوية',
        nameFr: 'Génie Biomédical',
        descriptionAr: 'تطبيق مبادئ الهندسة لتطوير وصيانة الأجهزة والمعدات الطبية والرعاية الصحية.',
        descriptionFr: 'Application des principes de l’ingénierie au domaine médical pour le diagnostic et le traitement.'
      },
      {
        id: 'Genie Industriel',
        nameAr: 'هندسة صناعية',
        nameFr: 'Génie Industriel',
        descriptionAr: 'تحسين وتطوير العمليات والإنتاج وإدارة المؤسسات الصناعية والخدماتية.',
        descriptionFr: 'Optimisation des processus de production, logistique et management de la performance industrielle.'
      },
      {
        id: 'Telecommunications',
        nameAr: 'اتصالات سلكية ولاسلكية',
        nameFr: 'Télécommunications',
        descriptionAr: 'تصميم أنظمة نقل البيانات وشبكات الهاتف والإنترنت والأقمار الصناعية.',
        descriptionFr: 'Conception des réseaux de transmission de données, téléphonie, internet et satellites.'
      },
      {
        id: 'Energies Renouvelables',
        nameAr: 'طاقات متجددة',
        nameFr: 'Énergies Renouvelables',
        descriptionAr: 'دراسة وتطوير طاقات المستقبل كالطاقة الشمسية، طاقة الرياح والكتلة الحيوية.',
        descriptionFr: 'Étude et exploitation des énergies propres et durables (solaire, éolienne, biomasse).'
      }
    ]
  },
  {
    id: 'B',
    name: 'Groupe B',
    color: 'blue',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/25 dark:to-indigo-950/25',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    textCol: 'text-blue-700 dark:text-blue-400',
    descriptionAr: 'يركز على الهندسة الميكانيكية، الطيران، البناء، الري، والأشغال العمومية.',
    descriptionFr: 'Axé sur la construction mécanique, l’aéronautique, le génie civil, l’hydraulique et les infrastructures.',
    specialties: [
      {
        id: 'Genie Mecanique',
        nameAr: 'هندسة ميكانيكية',
        nameFr: 'Génie Mécanique',
        descriptionAr: 'تصميم وتصنيع وصيانة الأنظمة الميكانيكية والمحركات والهياكل.',
        descriptionFr: 'Conception, fabrication et maintenance des systèmes mécaniques, moteurs et structures.'
      },
      {
        id: 'Aeronautique',
        nameAr: 'طيران',
        nameFr: 'Aéronautique',
        descriptionAr: 'دراسة وتصميم الطائرات والمركبات الجوية وأنظمتها الديناميكية والميكانيكية.',
        descriptionFr: 'Conception, construction et maintenance des aéronefs et systèmes aéronautiques.'
      },
      {
        id: 'Genie Civil',
        nameAr: 'هندسة مدنية',
        nameFr: 'Génie Civil',
        descriptionAr: 'تصميم وبناء البنى التحتية مثل المباني، الجسور، والطرقات المقاومة للزلازل.',
        descriptionFr: 'Conception et construction de bâtiments, ponts, tunnels et infrastructures durables.'
      },
      {
        id: 'Genie Climatique',
        nameAr: 'هندسة مناخية',
        nameFr: 'Génie Climatique',
        descriptionAr: 'التحكم في المناخ الداخلي (التهوية، التدفئة، التبريد) وكفاءة الطاقة للمباني.',
        descriptionFr: 'Maîtrise du confort thermique (chauffage, ventilation, climatisation) et efficacité énergétique.'
      },
      {
        id: 'Genie Maritime Hydraulique',
        nameAr: 'هندسة بحرية وهيدروليكية',
        nameFr: 'Génie Maritime Hydraulique',
        descriptionAr: 'إدارة الموارد المائية، السدود، المنشآت المرفئية وتصميم السفن ومنشآت البحار.',
        descriptionFr: 'Gestion de l’eau, construction de barrages, ports, et ingénierie navale ou côtière.'
      },
      {
        id: 'Ingenierie des Transports',
        nameAr: 'هندسة النقل',
        nameFr: 'Ingénierie des Transports',
        descriptionAr: 'تخطيط وتصميم وإدارة شبكات النقل البري والجوي والبحري وحركة المرور.',
        descriptionFr: 'Planification, conception et exploitation des réseaux et systèmes de transport.'
      },
      {
        id: 'Optique et Mecanique de Precision',
        nameAr: 'بصريات وميكانيك الدقة',
        nameFr: 'Optique et Mécanique de Précision',
        descriptionAr: 'تصميم وتصنيع الأجهزة البصرية الدقيقة والأنظمة النانوية والميكروميكانيكية.',
        descriptionFr: 'Étude et fabrication d’instruments optiques et de composants mécaniques de haute précision.'
      },
      {
        id: 'Metallurgie',
        nameAr: 'علم المعادن',
        nameFr: 'Métallurgie',
        descriptionAr: 'دراسة سلوك المعادن واستخلاصها وتطوير سبائك جديدة للاستخدامات الصناعية.',
        descriptionFr: 'Science des métaux, traitement thermique, élaboration et caractérisation des alliages.'
      },
      {
        id: 'Travaux Publics',
        nameAr: 'أشغال عمومية',
        nameFr: 'Travaux Publics',
        descriptionAr: 'تخطيط وتشييد الطرق، السكك الحديدية والمطارات والمنشآت الكبرى التابعة للدولة.',
        descriptionFr: 'Réalisation d’infrastructures de transport de grande envergure (routes, voies ferrées, aéroports).'
      }
    ]
  },
  {
    id: 'C',
    name: 'Groupe C',
    color: 'amber',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/25 dark:to-orange-950/25',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    textCol: 'text-amber-700 dark:text-amber-400',
    descriptionAr: 'يركز على الصناعات الكيميائية والنفطية، التعدين، النظافة والأمن الصناعي وحماية البيئة.',
    descriptionFr: 'Axé sur les procédés chimiques, pétroliers, l’exploitation minière, la sécurité industrielle et l’environnement.',
    specialties: [
      {
        id: 'Genie des Procedes',
        nameAr: 'هندسة الطرائق',
        nameFr: 'Génie des Procédés',
        descriptionAr: 'تحويل المواد الخام إلى مواد مصنعة من خلال عمليات كيميائية وفيزيائية وحيوية.',
        descriptionFr: 'Transformation de la matière première en produits finis par des procédés physico-chimiques.'
      },
      {
        id: 'Genie Minier',
        nameAr: 'هندسة المناجم',
        nameFr: 'Génie Minier',
        descriptionAr: 'استكشاف واستخراج المعادن والثروات الباطنية وتسيير المناجم والمقالع بشكل آمن.',
        descriptionFr: 'Exploration, extraction et valorisation des ressources minérales et gestion des mines.'
      },
      {
        id: 'Hydrocarbures',
        nameAr: 'محروقات',
        nameFr: 'Hydrocarbures',
        descriptionAr: 'تكنولوجيا إنتاج النفط والغاز، الحفر والاستكشاف وتسيير الآبار النفطية.',
        descriptionFr: 'Technologies d’exploration, forage, production et transport du pétrole et du gaz.'
      },
      {
        id: 'Hygiene et Securite Industrielle',
        nameAr: 'نظافة وأمن صناعي',
        nameFr: 'Hygiène et Sécurité Industrielle',
        descriptionAr: 'تقييم المخاطر في المصانع وحماية العمال والمنشآت من الحوادث والحرائق.',
        descriptionFr: 'Évaluation des risques, protection des travailleurs et des installations industrielles.'
      },
      {
        id: 'Industries Petrochimiques',
        nameAr: 'صناعات بتروكيماوية',
        nameFr: 'Industries Pétrochimiques',
        descriptionAr: 'تكرير البترول وصناعة البلاستيك والأسمدة والمواد المشتقة من النفط.',
        descriptionFr: 'Raffinage du pétrole et fabrication de polymères, plastiques et dérivés chimiques.'
      },
      {
        id: 'Sciences et Genie de l’Environnement',
        nameAr: 'علوم وهندسة البيئة',
        nameFr: 'Sciences et Génie de l’Environnement',
        descriptionAr: 'معالجة المياه والهواء والنفايات الصلبة ووضع استراتيجيات التنمية المستدامة والمحافظة على البيئة.',
        descriptionFr: 'Traitement des polluants (eau, air, sol) et gestion durable des ressources environnementales.'
      }
    ]
  }
];

export const MOCK_REGISTRATIONS: StudentRegistration[] = [
  {
    id: 'reg_1',
    firstName: 'سفيان',
    lastName: 'بلقاسم',
    dateOfBirth: '2003-05-12',
    studentCardNumber: '212135012345',
    firstYearSpecialty: 'Génie Electrique',
    rankedGroups: ['A', 'B', 'C'],
    registrationDate: '2026-06-25T14:30:00-07:00'
  },
  {
    id: 'reg_2',
    firstName: 'أمينة',
    lastName: 'منصوري',
    dateOfBirth: '2004-11-20',
    studentCardNumber: '222236045612',
    firstYearSpecialty: 'Génie Civil',
    rankedGroups: ['B', 'C', 'A'],
    registrationDate: '2026-06-25T16:15:00-07:00'
  },
  {
    id: 'reg_3',
    firstName: 'محمد',
    lastName: 'حداد',
    dateOfBirth: '2003-08-30',
    studentCardNumber: '222235078945',
    firstYearSpecialty: 'Génie des Procédés',
    rankedGroups: ['C', 'A', 'B'],
    registrationDate: '2026-06-26T09:12:00-07:00'
  },
  {
    id: 'reg_4',
    firstName: 'مريم',
    lastName: 'بوعزة',
    dateOfBirth: '2003-01-15',
    studentCardNumber: '212134098712',
    firstYearSpecialty: 'Génie Electrique',
    rankedGroups: ['A', 'C', 'B'],
    registrationDate: '2026-06-26T10:45:00-07:00'
  },
  {
    id: 'reg_5',
    firstName: 'رياض',
    lastName: 'خليفي',
    dateOfBirth: '2004-03-04',
    studentCardNumber: '222239011223',
    firstYearSpecialty: 'Génie Mécanique',
    rankedGroups: ['B', 'A', 'C'],
    registrationDate: '2026-06-26T11:20:00-07:00'
  },
  {
    id: 'reg_6',
    firstName: 'ياسمين',
    lastName: 'مزياني',
    dateOfBirth: '2004-07-22',
    studentCardNumber: '222236077889',
    firstYearSpecialty: 'ST-ING جذع مشترك علوم وتكنولوجيا',
    rankedGroups: ['C', 'B', 'A'],
    registrationDate: '2026-06-26T12:05:00-07:00'
  }
];
