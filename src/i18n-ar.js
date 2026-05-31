/*
 * ============================================================================
 * ARABIC TRANSLATIONS — PENDING UASC AUTHORITATIVE REVIEW.
 * Do not deploy publicly until each string has been validated by UASC staff
 * for institutional and operational appropriateness.
 * ============================================================================
 *
 * Level 1 translation: Arabic strings render in their natural RTL reading
 * direction inside each element, but the overall page layout stays LTR (no
 * structural mirroring). Strings are keyed by their exact English source text;
 * the runtime walks the DOM and substitutes matches, falling back to English
 * for anything not present here. These are INITIAL machine-assisted drafts.
 *
 * `text`  — English UI source string → Arabic (used by the DOM translator).
 * `keys`  — t() registry keys → Arabic (used by the t() lookup, lang 'ar').
 *
 * Loaded as a plain <script> before app.js / home.js; build.js inlines it.
 */
(function (global) {
  'use strict';

  var text = {
    // --- Settings / gear ---
    'Settings': 'الإعدادات',
    'Units': 'الوحدات',
    'Metric (km, m, m/s)': 'متري (كم، م، م/ث)',
    'Imperial (mi, ft, mph)': 'إمبراطوري (ميل، قدم، ميل/س)',
    'Date format': 'تنسيق التاريخ',
    'Coordinates': 'الإحداثيات',
    'Decimal degrees': 'درجات عشرية',
    'DMS': 'درجات/دقائق/ثوانٍ',
    'UTM grid': 'شبكة UTM',
    'Language': 'اللغة',

    // --- Landing / header ---
    'DFR Deployment Planner': 'مخطط نشر الطائرات المسيّرة كأول مستجيب',
    'DRONE-AS-FIRST-RESPONDER · PLANNING SUITE': 'الطائرة المسيّرة كأول مستجيب · مجموعة التخطيط',
    'Unmanned Aerial Systems Center': 'مركز أنظمة الطيران بدون طيار',
    'Dubai Police': 'شرطة دبي',
    'SYSTEM READY': 'النظام جاهز',
    'TRY WITH SAMPLE MISSION →': 'جرّب بمهمة نموذجية ←',
    'OPEN PLANNER': 'افتح المخطط',
    'Load Saved Plan': 'تحميل خطة محفوظة',
    'Why This Tool Exists': 'لماذا وُجدت هذه الأداة',
    'Terms of Use': 'شروط الاستخدام',
    'UNMANNED AERIAL SYSTEMS CENTER · DUBAI POLICE': 'مركز أنظمة الطيران بدون طيار · شرطة دبي',
    '© UASC, Dubai Police, 2026. All rights reserved.': '© مركز أنظمة الطيران بدون طيار، شرطة دبي، 2026. جميع الحقوق محفوظة.',

    // --- Step tags / panel titles ---
    'STEP 01': 'الخطوة 01',
    'STEP 02': 'الخطوة 02',
    'STEP 03': 'الخطوة 03',
    'STEP 04': 'الخطوة 04',
    'METRICS': 'المقاييس',
    'COMPARE': 'مقارنة',
    'LEGAL': 'قانوني',
    'ABOUT': 'حول',
    'EXPORT': 'تصدير',
    'AREA': 'المنطقة',
    'Define Operational Area': 'تحديد منطقة العمليات',
    'Incident Data': 'بيانات البلاغات',
    'Report & Handoff': 'التقرير والتسليم',
    'Mission Snapshot': 'لمحة عن المهمة',

    // --- Step 01 sections / controls ---
    'Operational Area': 'منطقة العمليات',
    'Boundary Library': 'مكتبة الحدود',
    'Existing Deployment': 'النشر الحالي',
    'Objective': 'الهدف',
    'Dispatch': 'الإرسال',
    'Rectangle': 'مستطيل',
    'Draw': 'رسم',
    'Upload': 'رفع',
    'Clear All': 'مسح الكل',
    'None': 'لا شيء',
    'Place on map': 'تحديد على الخريطة',
    'Upload CSV': 'رفع ملف CSV',
    'Load Built-in Water': 'تحميل بيانات المياه المدمجة',
    'Upload Water Layer': 'رفع طبقة المياه',
    'Continue to Incident Data': 'المتابعة إلى بيانات البلاغات',
    'No water exclusions': 'لا توجد استبعادات مائية',
    'No no-deploy zones': 'لا توجد مناطق حظر نشر',
    'No existing stations': 'لا توجد محطات حالية',
    'Awaiting area selection': 'بانتظار تحديد المنطقة',
    'Specify stations you already operate to see what to keep, add, or remove.': 'حدّد المحطات التي تشغّلها بالفعل لمعرفة ما يجب الإبقاء عليه أو إضافته أو إزالته.',

    // --- Step 02 ---
    'Time Window': 'النافذة الزمنية',
    'Incident Categories': 'فئات البلاغات',
    'Count': 'العدد',
    'Distribution': 'التوزيع',
    'Advanced': 'إعدادات متقدمة',
    'Generate': 'توليد',
    'Override': 'تجاوز',
    '+ Add Category': '+ إضافة فئة',
    'No incident data': 'لا توجد بيانات بلاغات',
    '1 day': 'يوم واحد',
    '1 week': 'أسبوع واحد',
    '1 month': 'شهر واحد',
    '1 year': 'سنة واحدة',

    // --- Step 03 ---
    'Analytical Approach': 'المنهج التحليلي',
    'Method': 'الطريقة',
    'Compute Deployment': 'حساب النشر',
    'Re-compute': 'إعادة الحساب',
    'No deployment computed': 'لم يُحسب أي نشر',
    'Continue to Report': 'المتابعة إلى التقرير',

    // --- Step 04 / metrics / exports ---
    'REPORT CONTENT': 'محتوى التقرير',
    'HANDOFF': 'التسليم',
    'Operation ID': 'معرّف العملية',
    'Classification': 'التصنيف',
    'Area': 'المساحة',
    'Incidents': 'البلاغات',
    'Sites': 'المواقع',
    'DroneBox Units': 'وحدات DroneBox',
    'Geographic Cov.': 'التغطية الجغرافية',
    'KPI Compliance': 'الامتثال لمؤشر الأداء',
    'Load Plan': 'تحميل الخطة',
    'Save Plan': 'حفظ الخطة',
    'Export Excel': 'تصدير Excel',
    'Export CSV': 'تصدير CSV',
    'Generate PDF': 'إنشاء PDF',
    'Reset': 'إعادة تعيين',
    'Back': 'رجوع',
    'Current': 'الحالي',
    'Recommended': 'المُوصى به',

    // --- Common buttons / status ---
    'Load Sample Mission': 'تحميل مهمة نموذجية',
    'Idle': 'خامل',
    'Lock': 'تثبيت',

    // --- About modal ---
    'WHAT THIS TOOL IS': 'ما هي هذه الأداة',
    'THE MATH, SIMPLY': 'الرياضيات ببساطة',
    'METHODS': 'المنهجيات',
    'ABOUT US': 'من نحن',
    'From operations, for operations.': 'من الميدان، إلى الميدان.',
    'The algorithms, in plain language.': 'الخوارزميات بلغة مبسّطة.',
    'Plans where to deploy drone-response stations.': 'يخطّط لمواقع نشر محطات الاستجابة بالطائرات المسيّرة.',
    'Built with': 'مبني باستخدام',

    // --- Terms of Use modal ---
    'TERMS OF USE': 'شروط الاستخدام',
    'Planning-grade tool. Use with judgment.': 'أداة بمستوى تخطيطي. استخدمها بتقدير مهني.',
    'WHO MAY USE IT': 'من يحق له استخدامها',
    'PLANNING-GRADE RECOMMENDATIONS': 'توصيات بمستوى تخطيطي',
    'NO WARRANTY': 'إخلاء المسؤولية',
    'DATA HANDLING': 'معالجة البيانات',
    'CONTACT': 'التواصل',
    'Close': 'إغلاق'
  };

  var keys = {
    'settings.title': 'الإعدادات',
    'settings.units': 'الوحدات',
    'settings.units.metric': 'متري (كم، م، م/ث)',
    'settings.units.imperial': 'إمبراطوري (ميل، قدم، ميل/س)',
    'settings.dateFormat': 'تنسيق التاريخ',
    'settings.open': 'الإعدادات',
    'onboarding.title': 'مرحبًا بك في مخطط نشر الطائرات المسيّرة',
    'onboarding.continue': 'متابعة',
    'map.heatmap.toggle': 'تبديل الخريطة الحرارية لكثافة البلاغات',
    'sample.load': 'تحميل مهمة نموذجية',
    'step02.advanced': 'إعدادات متقدمة',
    'step02.timeWindow.override': 'تجاوز',
    'about.builtWith': 'مبني باستخدام'
  };

  global.DFR_I18N_AR = { pendingReview: true, text: text, keys: keys };

})(typeof window !== 'undefined' ? window : this);
