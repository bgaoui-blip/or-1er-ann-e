export interface StudentRegistration {
  id: string;
  firstName: string; // الاسم الأول
  lastName: string;  // اللقب
  dateOfBirth: string; // تاريخ الميلاد
  studentCardNumber: string; // رقم بطاقة الطالب
  firstYearSpecialty: string; // تخصص السنة الأولى
  rankedGroups: ('A' | 'B' | 'C')[]; // ترتيب المجموعات تنازلياً (الرغبة 1، 2، 3)
  registrationDate: string; // تاريخ ووقت التسجيل
}

export interface Specialty {
  id: string;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
}

export interface GroupDefinition {
  id: 'A' | 'B' | 'C';
  name: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  badgeBg: string;
  textCol: string;
  descriptionAr: string;
  descriptionFr: string;
  specialties: Specialty[];
}
