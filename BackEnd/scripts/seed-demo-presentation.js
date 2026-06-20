#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'bridge.sqlite');
const exercisesPath = path.join(__dirname, '..', 'src', 'mock-data', 'exercises.json');

const PRESENTATION_DATE = new Date('2026-06-23T08:00:00+03:00');
const PLAN_START_DATE = new Date('2026-06-21T08:00:00+03:00');
const DEFAULT_PASSWORD_LABEL = 'Teacher123!';
const DEMO_PREFIX = 'demo_';

const ARABIC_SKILLS = [
  { id: 'skill_vocal', max: 6 },
  { id: 'skill_sounds_of_letters', max: 8 },
  { id: 'skill_writing', max: 4 },
];

const MATH_SKILLS = [
  { id: 'skill_counting', max: 5 },
  { id: 'skill_number_manipulation', max: 12 },
  { id: 'skill_problem_solving', max: 7 },
];

const INSTITUTIONS = [
  {
    schoolId: 'demo_school_101',
    schoolName: 'أكاديمية الريادة',
    institutionUserId: 'demo_institution_1',
    institutionName: 'إدارة أكاديمية الريادة',
    institutionEmail: 'riyadah.academy.office@gmail.com',
    joinCode: 'Riyada8426',
    teachers: [
      {
        userId: 'demo_teacher_1',
        fullName: 'سارة العلي',
        email: 'sara.ali.edu@gmail.com',
        section: 'A',
        studentCount: 22,
        slightlyLate: false,
      },
      {
        userId: 'demo_teacher_2',
        fullName: 'نور الخطيب',
        email: 'nour.khateeb.edu@gmail.com',
        section: 'B',
        studentCount: 24,
        slightlyLate: false,
      },
    ],
  },
  {
    schoolId: 'demo_school_102',
    schoolName: 'مدرسة الغد المشرق',
    institutionUserId: 'demo_institution_2',
    institutionName: 'إدارة مدرسة الغد المشرق',
    institutionEmail: 'ghad.school.office@gmail.com',
    joinCode: 'Ghad5319',
    teachers: [
      {
        userId: 'demo_teacher_3',
        fullName: 'هبة الشامي',
        email: 'hiba.shami.edu@gmail.com',
        section: 'A',
        studentCount: 21,
        slightlyLate: false,
      },
      {
        userId: 'demo_teacher_4',
        fullName: 'آية درويش',
        email: 'aya.darwish.edu@gmail.com',
        section: 'B',
        studentCount: 23,
        slightlyLate: true,
      },
      {
        userId: 'demo_teacher_5',
        fullName: 'ريم المصري',
        email: 'reem.masri.edu@gmail.com',
        section: 'C',
        studentCount: 25,
        slightlyLate: true,
      },
      {
        userId: 'demo_teacher_6',
        fullName: 'دلال الزعبي',
        email: 'dalal.zoubi.edu@gmail.com',
        section: 'D',
        studentCount: 23,
        slightlyLate: false,
        compressionDemoSubjects: ['2'],
        planStartDates: {
          '2': '2026-04-05T08:00:00+03:00',
        },
      },
      {
        userId: 'demo_teacher_7',
        fullName: 'ميس الحوراني',
        email: 'mais.hourani.edu@gmail.com',
        section: 'E',
        studentCount: 22,
        slightlyLate: false,
        bufferDemoSubjects: ['2'],
      },
    ],
  },
];

function openDatabase(filename) {
  return new sqlite3.Database(filename);
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve(this);
    });
  });
}

function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row ?? null);
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function iso(date) {
  return new Date(date).toISOString();
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function differenceInCalendarDays(left, right) {
  const startOfLeft = new Date(left);
  startOfLeft.setHours(0, 0, 0, 0);
  const startOfRight = new Date(right);
  startOfRight.setHours(0, 0, 0, 0);
  return Math.round(
    (startOfLeft.getTime() - startOfRight.getTime()) / (24 * 60 * 60 * 1000),
  );
}

function levelForPercent(percent) {
  if (percent < 40) return 'Beginner';
  if (percent < 75) return 'Intermediate';
  return 'Advanced';
}

function subjectSkillIds(subjectId) {
  return String(subjectId) === '1' ? MATH_SKILLS : ARABIC_SKILLS;
}

function normalizeExercise(raw) {
  return {
    curriculumItemId: String(raw.curriculumItemId ?? raw.CurriculumItemId),
    subjectId: String(raw.subjectId ?? raw.SubjectId),
    name: String(raw.name ?? raw.Name),
    unitNo: Number(raw.unitNo ?? raw.UnitNo ?? 1),
    lessonNo: Number(raw.lessonNo ?? raw.LessonNo ?? 1),
    orderInLesson: Number(raw.orderInLesson ?? raw.OrderInLesson ?? 1),
    estimatedTime: Number(raw.estimatedTime ?? raw.EstimatedTime ?? 6),
    skillsSupported: Array.isArray(raw.skillsSupported ?? raw.SkillsSupported)
      ? (raw.skillsSupported ?? raw.SkillsSupported).map(String)
      : [],
    difficulity: Number(raw.difficulity ?? raw.Difficulity ?? 1),
  };
}

function sortCurriculumItems(items) {
  return [...items].sort((left, right) => (
    Number(left.unitNo) - Number(right.unitNo)
    || Number(left.lessonNo) - Number(right.lessonNo)
    || Number(left.orderInLesson) - Number(right.orderInLesson)
    || String(left.curriculumItemId).localeCompare(String(right.curriculumItemId))
  ));
}

function buildParentLinkCode(studentId) {
  const digits = String(studentId)
    .split('')
    .filter((char) => char >= '0' && char <= '9')
    .join('')
    .slice(-6)
    .padStart(6, '0');

  return `BR-${digits.slice(0, 3)}-${digits.slice(3)}`;
}

function createStudentName(index) {
  const firstNames = [
    { ar: 'آدم', en: 'Adam' },
    { ar: 'ليان', en: 'Layan' },
    { ar: 'نور', en: 'Noor' },
    { ar: 'سليم', en: 'Saleem' },
    { ar: 'تالا', en: 'Tala' },
    { ar: 'ريم', en: 'Reem' },
    { ar: 'عمر', en: 'Omar' },
    { ar: 'جود', en: 'Joud' },
    { ar: 'زين', en: 'Zain' },
    { ar: 'ريان', en: 'Rayyan' },
    { ar: 'ميرا', en: 'Mira' },
    { ar: 'كريم', en: 'Kareem' },
    { ar: 'لينا', en: 'Lina' },
    { ar: 'حمزة', en: 'Hamza' },
    { ar: 'سندس', en: 'Sondos' },
    { ar: 'يوسف', en: 'Yousef' },
    { ar: 'ورد', en: 'Ward' },
    { ar: 'قصي', en: 'Qusai' },
    { ar: 'هيا', en: 'Haya' },
    { ar: 'ديما', en: 'Dima' },
    { ar: 'أمير', en: 'Ameer' },
    { ar: 'رغد', en: 'Raghad' },
    { ar: 'سما', en: 'Sama' },
    { ar: 'بيان', en: 'Bayan' },
    { ar: 'كرم', en: 'Karam' },
  ];
  const familyNames = [
    { ar: 'أحمد', en: 'Ahmad' },
    { ar: 'الحسن', en: 'Al Hasan' },
    { ar: 'الخطيب', en: 'Al Khateeb' },
    { ar: 'النجار', en: 'Al Najjar' },
    { ar: 'العلي', en: 'Al Ali' },
    { ar: 'المصري', en: 'Al Masri' },
    { ar: 'الشامي', en: 'Al Shami' },
    { ar: 'درويش', en: 'Darwish' },
    { ar: 'التميمي', en: 'Al Tamimi' },
    { ar: 'الزعبي', en: 'Al Zoubi' },
  ];
  const first = firstNames[index % firstNames.length];
  const father = familyNames[Math.floor(index / firstNames.length) % familyNames.length];
  const family = familyNames[(index + 3) % familyNames.length];

  return {
    arabic: `${first.ar} ${father.ar} ${family.ar}`,
    english: `${first.en} ${father.en} ${family.en}`,
  };
}

function buildQuestionSet(teacherId, subjectId, variantIndex) {
  const isMath = String(subjectId) === '1';
  const prefix = isMath ? 'الرياضيات' : 'اللغة العربية';

  if (variantIndex % 2 === 0) {
    return [
      {
        quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_1`,
        prompt: isMath
          ? 'ما العدد الذي يأتي بعد العدد ٤٩؟'
          : 'اختر الكلمة التي تبدأ بحرف الباء.',
        type: 'MULTIPLE_CHOICE',
        attachments: [],
        options: isMath
          ? [
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1a`, text: '٥٠', isCorrect: true },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1b`, text: '٤٨', isCorrect: false },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1c`, text: '٥٩', isCorrect: false },
            ]
          : [
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1a`, text: 'باب', isCorrect: true },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1b`, text: 'دار', isCorrect: false },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_1c`, text: 'نور', isCorrect: false },
            ],
      },
      {
        quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_2`,
        prompt: isMath
          ? 'اكتب جملة قصيرة تشرح كيف عرفت الإجابة.'
          : 'اكتب جملة مفيدة باستخدام الكلمة المناسبة.',
        type: 'ESSAY',
        attachments: [],
        options: [],
      },
      {
        quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_3`,
        prompt: isMath
          ? 'كم يساوي ٣٠ + ٢٠؟'
          : 'اختر الجملة المكتوبة بشكل صحيح.',
        type: 'MULTIPLE_CHOICE',
        attachments: [],
        options: isMath
          ? [
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3a`, text: '٥٠', isCorrect: true },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3b`, text: '٦٠', isCorrect: false },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3c`, text: '٤٠', isCorrect: false },
            ]
          : [
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3a`, text: 'ذهبَ الطالبُ إلى المدرسةِ.', isCorrect: true },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3b`, text: 'ذهبَ الطالبُ إلى المدرسةُ.', isCorrect: false },
              { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_3c`, text: 'ذهبَ الطالبِ إلى المدرسةِ.', isCorrect: false },
            ],
      },
    ];
  }

  return [
    {
      quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_1`,
      prompt: isMath
        ? 'اختر الشكل الذي يساعدك على حل المسألة.'
        : 'ما الفكرة الرئيسة في الجملة؟',
      type: 'ESSAY',
      attachments: [],
      options: [],
    },
    {
      quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_2`,
      prompt: isMath
        ? 'أي عملية نستخدم لإيجاد المجموع؟'
        : 'اختر الكلمة التي تحتوي على مد بالألف.',
      type: 'MULTIPLE_CHOICE',
      attachments: [],
      options: isMath
        ? [
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2a`, text: 'الجمع', isCorrect: true },
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2b`, text: 'الطرح', isCorrect: false },
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2c`, text: 'القسمة', isCorrect: false },
          ]
        : [
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2a`, text: 'باب', isCorrect: true },
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2b`, text: 'بنت', isCorrect: false },
            { quizOptionId: `demo_option_${teacherId}_${subjectId}_${variantIndex}_2c`, text: 'بيت', isCorrect: false },
          ],
    },
    {
      quizQuestionId: `demo_question_${teacherId}_${subjectId}_${variantIndex}_3`,
      prompt: `${prefix}: اكتب إجابة قصيرة وواضحة.`,
      type: 'ESSAY',
      attachments: [],
      options: [],
    },
  ];
}

function buildCompressionFixturePlanData(teacher, subjectId, subjectItems) {
  const planStart = new Date('2026-06-14T08:00:00+03:00');
  const planId = `demo_plan_${teacher.userId}_${subjectId}_${planStart.getTime()}`;
  const planName =
    String(subjectId) === '1'
      ? `خطة الرياضيات - ${teacher.fullName}`
      : `خطة اللغة العربية - ${teacher.fullName}`;

  const fixtureSessions = [
    { day: 'Sunday', date: '2026-06-14T08:00:00+03:00', weekNo: 1, statuses: ['Completed', 'Completed', 'Completed', 'Completed'] },
    { day: 'Monday', date: '2026-06-15T08:00:00+03:00', weekNo: 1, statuses: ['Planned', 'Planned', 'Planned', 'Planned'] },
    { day: 'Tuesday', date: '2026-06-16T08:00:00+03:00', weekNo: 1, statuses: ['Planned', 'Planned', 'Planned', 'Planned'] },
    { day: 'Wednesday', date: '2026-06-17T08:00:00+03:00', weekNo: 1, statuses: ['Planned', 'Planned', 'Planned', 'Planned'] },
    { day: 'Thursday', date: '2026-06-18T08:00:00+03:00', weekNo: 1, statuses: ['Planned', 'Planned', 'Planned', 'Planned'] },
  ];

  const completedDurationPattern = [10, 6, 6, 6];
  const plannedDurationPattern = [10, 9, 6, 6];
  const priorityPattern = ['HIGH', 'MID', 'LOW', 'LOW'];
  const planItems = [];
  const sessions = [];
  const planLogs = [
    {
      planLogId: `demo_plan_log_${teacher.userId}_${subjectId}_generated`,
      planId,
      sessionId: null,
      planItemId: null,
      curriculumItemId: null,
      actionType: 'PLAN_GENERATED',
      description: `تم إنشاء ${planName}.`,
      createdAt: iso(addDays(planStart, -1)),
      metadataJson: JSON.stringify({
        teacherId: teacher.userId,
        subjectId: String(subjectId),
        planName,
        fixtureType: 'compression',
      }),
    },
  ];

  let itemCursor = 0;
  fixtureSessions.forEach((sessionSeed, sessionIndex) => {
    const sessionId = `demo_session_${teacher.userId}_${subjectId}_compression_${sessionIndex + 1}`;
    const items = [];
    let usedDuration = 0;

    for (let localIndex = 0; localIndex < 4; localIndex += 1) {
      const source = subjectItems[(itemCursor + localIndex) % subjectItems.length];
      const priority = priorityPattern[localIndex];
      const status = sessionSeed.statuses[localIndex];
      const estimatedTime =
        status === 'Completed'
          ? completedDurationPattern[localIndex]
          : plannedDurationPattern[localIndex];
      const finalEstimatedTime =
        status === 'Planned' && sessionIndex === fixtureSessions.length - 1 && localIndex === 3
          ? 5
          : estimatedTime;
      const planItemId = `demo_plan_item_${teacher.userId}_${subjectId}_compression_${sessionIndex + 1}_${localIndex + 1}`;
      const minEstimatedTime =
        priority === 'HIGH'
          ? finalEstimatedTime
          : priority === 'MID'
            ? Math.max(6, finalEstimatedTime - 3)
            : Math.max(3, finalEstimatedTime - 6);

      const item = {
        planItemId,
        planId,
        sessionId,
        curriculumItemId: String(source.curriculumItemId),
        subjectId: String(subjectId),
        title: source.name,
        unitNo: Number(source.unitNo),
        lessonNo: Number(source.lessonNo),
        orderInLesson: Number(source.orderInLesson),
        estimatedTime: finalEstimatedTime,
        originalEstimatedTime: estimatedTime,
        minEstimatedTime,
        priority,
        isCompressible: priority !== 'HIGH',
        status,
        carriedForwardCount: 0,
        notes: null,
      };

      items.push(item);
      planItems.push(item);
      usedDuration += finalEstimatedTime;

      if (status === 'Completed') {
        planLogs.push({
          planLogId: `demo_plan_log_${planItemId}`,
          planId,
          sessionId,
          planItemId,
          curriculumItemId: String(source.curriculumItemId),
          actionType: 'ITEM_COMPLETED',
          description: `أُنجز النشاط "${source.name}".`,
          createdAt: iso(new Date(new Date(sessionSeed.date).getTime() + 60 * 60 * 1000)),
          metadataJson: JSON.stringify({
            status: 'Completed',
            estimatedTime: finalEstimatedTime,
          }),
        });
      }
    }

    itemCursor += 4;

    sessions.push({
      sessionId,
      teacherId: teacher.userId,
      subjectId: String(subjectId),
      day: sessionSeed.day,
      items,
      maxDuration: 30,
      usedDuration,
      reviewBufferMinutes: 2,
      slotNumber: 1,
      sessionDate: new Date(sessionSeed.date),
      sessionWeekNo: sessionSeed.weekNo,
    });
  });

  return {
    plan: {
      planId,
      planName,
      subjectId: String(subjectId),
      startDate: planStart,
      totalWeeks: 2,
      teacherId: teacher.userId,
      sessions,
      autoGenerated: true,
      planJson: '[]',
    },
    sessions,
    planItems,
    planLogs,
  };
}

function buildBufferFixturePlanData(teacher, subjectId, subjectItems) {
  const planStart = new Date('2026-06-21T08:00:00+03:00');
  const planId = `demo_plan_${teacher.userId}_${subjectId}_${planStart.getTime()}`;
  const planName =
    String(subjectId) === '1'
      ? `خطة الرياضيات - ${teacher.fullName}`
      : `خطة اللغة العربية - ${teacher.fullName}`;

  const fixtureSessions = [
    {
      day: 'Sunday',
      date: '2026-06-21T08:00:00+03:00',
      weekNo: 1,
      statuses: ['Completed', 'Completed', 'Completed', 'Completed'],
      durations: [6, 9, 6, 7],
      reviewBufferMinutes: 0,
    },
    {
      day: 'Monday',
      date: '2026-06-22T08:00:00+03:00',
      weekNo: 1,
      statuses: ['Completed', 'Completed', 'Completed', 'Completed'],
      durations: [6, 9, 6, 6],
      reviewBufferMinutes: 0,
    },
    {
      day: 'Tuesday',
      date: '2026-06-23T08:00:00+03:00',
      weekNo: 1,
      statuses: ['Planned', 'Planned', 'Planned', 'Planned'],
      durations: [6, 9, 6, 6],
      reviewBufferMinutes: 0,
    },
    {
      day: 'Wednesday',
      date: '2026-06-24T08:00:00+03:00',
      weekNo: 1,
      statuses: ['Planned', 'Planned', 'Planned', 'Planned'],
      durations: [10, 9, 6, 6],
      reviewBufferMinutes: 10,
    },
    {
      day: 'Thursday',
      date: '2026-06-25T08:00:00+03:00',
      weekNo: 1,
      statuses: ['Planned', 'Planned', 'Planned', 'Planned'],
      durations: [6, 9, 6, 6],
      reviewBufferMinutes: 0,
    },
  ];

  const priorityPattern = ['MID', 'LOW', 'MID', 'LOW'];
  const planItems = [];
  const sessions = [];
  const planLogs = [
    {
      planLogId: `demo_plan_log_${teacher.userId}_${subjectId}_generated`,
      planId,
      sessionId: null,
      planItemId: null,
      curriculumItemId: null,
      actionType: 'PLAN_GENERATED',
      description: `تم إنشاء ${planName}.`,
      createdAt: iso(addDays(planStart, -1)),
      metadataJson: JSON.stringify({
        teacherId: teacher.userId,
        subjectId: String(subjectId),
        planName,
        fixtureType: 'buffer',
      }),
    },
  ];

  let itemCursor = 0;
  fixtureSessions.forEach((sessionSeed, sessionIndex) => {
    const sessionId = `demo_session_${teacher.userId}_${subjectId}_buffer_${sessionIndex + 1}`;
    const items = [];
    let usedDuration = 0;

    for (let localIndex = 0; localIndex < 4; localIndex += 1) {
      const source = subjectItems[(itemCursor + localIndex) % subjectItems.length];
      const priority = priorityPattern[localIndex];
      const status = sessionSeed.statuses[localIndex];
      const estimatedTime = sessionSeed.durations[localIndex];
      const planItemId = `demo_plan_item_${teacher.userId}_${subjectId}_buffer_${sessionIndex + 1}_${localIndex + 1}`;
      const minEstimatedTime =
        priority === 'HIGH'
          ? estimatedTime
          : priority === 'MID'
            ? Math.max(6, estimatedTime - 3)
            : Math.max(3, estimatedTime - 6);

      const item = {
        planItemId,
        planId,
        sessionId,
        curriculumItemId: String(source.curriculumItemId),
        subjectId: String(subjectId),
        title: source.name,
        unitNo: Number(source.unitNo),
        lessonNo: Number(source.lessonNo),
        orderInLesson: Number(source.orderInLesson),
        estimatedTime,
        originalEstimatedTime: estimatedTime,
        minEstimatedTime,
        priority,
        isCompressible: priority !== 'HIGH',
        status,
        carriedForwardCount: 0,
        notes: null,
      };

      items.push(item);
      planItems.push(item);
      usedDuration += estimatedTime;

      if (status === 'Completed') {
        planLogs.push({
          planLogId: `demo_plan_log_${planItemId}`,
          planId,
          sessionId,
          planItemId,
          curriculumItemId: String(source.curriculumItemId),
          actionType: 'ITEM_COMPLETED',
          description: `أُنجز النشاط "${source.name}".`,
          createdAt: iso(new Date(new Date(sessionSeed.date).getTime() + 60 * 60 * 1000)),
          metadataJson: JSON.stringify({
            status: 'Completed',
            estimatedTime,
          }),
        });
      }
    }

    itemCursor += 4;

    sessions.push({
      sessionId,
      teacherId: teacher.userId,
      subjectId: String(subjectId),
      day: sessionSeed.day,
      items,
      maxDuration: 40,
      usedDuration,
      reviewBufferMinutes: sessionSeed.reviewBufferMinutes,
      slotNumber: 1,
      sessionDate: new Date(sessionSeed.date),
      sessionWeekNo: sessionSeed.weekNo,
    });
  });

  return {
    plan: {
      planId,
      planName,
      subjectId: String(subjectId),
      startDate: planStart,
      totalWeeks: 2,
      teacherId: teacher.userId,
      sessions,
      autoGenerated: true,
      planJson: '[]',
    },
    sessions,
    planItems,
    planLogs,
  };
}

function buildQuizResultAnswers(questions, status, studentIndex) {
  return questions.map((question, questionIndex) => {
    if (question.type === 'MULTIPLE_CHOICE') {
      const correct = question.options.find((option) => option.isCorrect);
      const wrong = question.options.find((option) => !option.isCorrect);
      const chooseCorrect = (studentIndex + questionIndex) % 3 !== 0;
      return {
        questionId: question.quizQuestionId,
        selectedOptionId: String(
          (chooseCorrect ? correct : wrong)?.quizOptionId ?? correct.quizOptionId,
        ),
        isCorrect: chooseCorrect,
      };
    }

    if (status === 'PENDING_REVIEW') {
      return {
        questionId: question.quizQuestionId,
        essayAnswer: 'أشرح الفكرة بكلمات بسيطة وأعطي مثالاً مناسباً.',
      };
    }

    return {
      questionId: question.quizQuestionId,
      essayAnswer: 'أشرح الفكرة بكلمات بسيطة وأعطي مثالاً مناسباً.',
      isCorrect: true,
    };
  });
}

async function loadExercises() {
  const content = await fs.readFile(exercisesPath, 'utf-8');
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed.map(normalizeExercise) : [];
}

function buildPlanData(teacher, subjectId, subjectItems) {
  const subjectLabel = String(subjectId) === '1' ? 'خطة الرياضيات' : 'خطة اللغة العربية';
  const planStart = new Date(
    teacher.planStartDates?.[String(subjectId)]
      ?? teacher.planStartDate
      ?? PLAN_START_DATE,
  );
  const planId = `demo_plan_${teacher.userId}_${subjectId}_${planStart.getTime()}`;
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const weekdayOffsets = [0, 1, 2, 3, 4];
  const sessions = [];
  const planItems = [];
  const planLogs = [
    {
      planLogId: `demo_plan_log_${teacher.userId}_${subjectId}_generated`,
      planId,
      sessionId: null,
      planItemId: null,
      curriculumItemId: null,
      actionType: 'PLAN_GENERATED',
      description: `تم إنشاء ${subjectLabel} للمعلمة ${teacher.fullName}.`,
      createdAt: iso(addDays(planStart, -1)),
      metadataJson: JSON.stringify({
        teacherId: teacher.userId,
        subjectId: String(subjectId),
        planName: subjectLabel,
      }),
    },
  ];
  const isCompressionDemoSubject = Array.isArray(teacher.compressionDemoSubjects)
    && teacher.compressionDemoSubjects.includes(String(subjectId));
  const isBufferDemoSubject = Array.isArray(teacher.bufferDemoSubjects)
    && teacher.bufferDemoSubjects.includes(String(subjectId));

  if (isCompressionDemoSubject) {
    return buildCompressionFixturePlanData(teacher, subjectId, subjectItems);
  }

  if (isBufferDemoSubject) {
    return buildBufferFixturePlanData(teacher, subjectId, subjectItems);
  }

  let itemCursor = 0;
  for (let weekIndex = 0; weekIndex < 12; weekIndex += 1) {
    for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
      const sessionIndex = weekIndex * days.length + dayIndex;
      const sessionDate = addDays(
        planStart,
        weekIndex * 7 + weekdayOffsets[dayIndex],
      );
      const sessionId = `demo_session_${teacher.userId}_${subjectId}_${sessionIndex + 1}`;
      const items = [];
      let usedDuration = 0;

      for (let localIndex = 0; localIndex < 4; localIndex += 1) {
        const source = subjectItems[(itemCursor + localIndex) % subjectItems.length];
        const estimatedTime = [6, 9, 6, 9][localIndex];
        const priority = localIndex % 2 === 0 ? 'MID' : 'LOW';
        const planItemId = `demo_plan_item_${teacher.userId}_${subjectId}_${sessionIndex + 1}_${localIndex + 1}`;
        const isPastForPresentation =
          sessionDate.getTime() < PRESENTATION_DATE.getTime();
        const shouldRemainPlanned =
          teacher.slightlyLate &&
          differenceInCalendarDays(PRESENTATION_DATE, sessionDate) <= 2 &&
          differenceInCalendarDays(PRESENTATION_DATE, sessionDate) > 0 &&
          localIndex === 3;
        const shouldForceCompressionBacklog =
          isCompressionDemoSubject &&
          differenceInCalendarDays(PRESENTATION_DATE, sessionDate) <= 2 &&
          differenceInCalendarDays(PRESENTATION_DATE, sessionDate) > 0;
        const status =
          isPastForPresentation &&
          !shouldRemainPlanned &&
          !shouldForceCompressionBacklog
            ? 'Completed'
            : 'Planned';

        const item = {
          planItemId,
          planId,
          sessionId,
          curriculumItemId: String(source.curriculumItemId),
          subjectId: String(subjectId),
          title: source.name,
          unitNo: Number(source.unitNo),
          lessonNo: Number(source.lessonNo),
          orderInLesson: Number(source.orderInLesson),
          estimatedTime,
          originalEstimatedTime: estimatedTime,
          minEstimatedTime:
            priority === 'MID'
              ? Math.max(6, estimatedTime - 3)
              : Math.max(3, estimatedTime - 6),
          priority,
          isCompressible: true,
          status,
          carriedForwardCount: 0,
          notes: null,
        };

        items.push(item);
        planItems.push(item);
        usedDuration += estimatedTime;

        if (status === 'Completed') {
          planLogs.push({
            planLogId: `demo_plan_log_${planItemId}`,
            planId,
            sessionId,
            planItemId,
            curriculumItemId: String(source.curriculumItemId),
            actionType: 'ITEM_COMPLETED',
            description: `أُنجز النشاط "${source.name}".`,
            createdAt: iso(new Date(sessionDate.getTime() + 60 * 60 * 1000)),
            metadataJson: JSON.stringify({
              status: 'Completed',
              estimatedTime,
            }),
          });
        }
      }

      itemCursor += 4;
      const sessionNumber = sessions.length + 1;
      const reviewBufferMinutes =
        sessionNumber % 4 === 0 ? 10 : 0;

      sessions.push({
        sessionId,
        teacherId: teacher.userId,
        subjectId: String(subjectId),
        day: days[dayIndex],
        items,
        maxDuration: 40,
        usedDuration,
        reviewBufferMinutes,
        slotNumber: 1,
        sessionDate,
        sessionWeekNo: weekIndex + 1,
      });
    }
  }

  return {
    plan: {
      planId,
      planName: `${subjectLabel} - ${teacher.fullName}`,
      subjectId: String(subjectId),
      startDate: planStart,
      totalWeeks: 12,
      teacherId: teacher.userId,
      sessions,
      autoGenerated: true,
      planJson: '[]',
    },
    sessions,
    planItems,
    planLogs,
  };
}

async function seedDemoData() {
  const db = openDatabase(dbPath);

  try {
    const passwordRow = await get(
      db,
      `SELECT password_hash AS passwordHash
       FROM users
       WHERE email IN ('teacher.normal@bridge.local', 'institution.bridge@bridge.local')
       LIMIT 1`,
    );

    if (!passwordRow?.passwordHash) {
      throw new Error('Could not locate an existing demo password hash to reuse.');
    }

    const exercises = await loadExercises();
    const mathItems = sortCurriculumItems(
      exercises.filter((item) => item.subjectId === '1'),
    );
    const arabicItems = sortCurriculumItems(
      exercises.filter((item) => item.subjectId === '2'),
    );
    const standardMathSequence = mathItems.slice(
      0,
      Math.max(1, mathItems.length - 40),
    );
    const standardArabicSequence = arabicItems.slice(
      0,
      Math.max(1, arabicItems.length - 40),
    );

    if (mathItems.length < 40 || arabicItems.length < 40) {
      throw new Error('Not enough curriculum items found to build the demo plans.');
    }

    await run(db, 'BEGIN TRANSACTION');

    const deleteStatements = [
      `DELETE FROM quiz_results WHERE quiz_result_id LIKE '${DEMO_PREFIX}%' OR assignment_id LIKE '${DEMO_PREFIX}%' OR quiz_id LIKE '${DEMO_PREFIX}%' OR student_id LIKE '${DEMO_PREFIX}%'`,
      `DELETE FROM assignments WHERE assignment_id LIKE '${DEMO_PREFIX}%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM quizzes WHERE quiz_id LIKE '${DEMO_PREFIX}%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM plan_logs WHERE plan_log_id LIKE '${DEMO_PREFIX}%' OR plan_id LIKE 'demo_plan_%'`,
      `DELETE FROM plan_items WHERE plan_item_id LIKE '${DEMO_PREFIX}%' OR plan_id LIKE 'demo_plan_%'`,
      `DELETE FROM sessions WHERE session_id LIKE '${DEMO_PREFIX}%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM plans WHERE plan_id LIKE 'demo_plan_%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM assessment_results WHERE result_id LIKE '${DEMO_PREFIX}%' OR student_id LIKE 'demo_student_%' OR upload_id LIKE 'demo_upload_%'`,
      `DELETE FROM uploads WHERE upload_id LIKE 'demo_upload_%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM institution_tasks WHERE task_id LIKE '${DEMO_PREFIX}%' OR school_id LIKE 'demo_school_%'`,
      `DELETE FROM institution_notifications WHERE notification_id LIKE '${DEMO_PREFIX}%' OR school_id LIKE 'demo_school_%'`,
      `DELETE FROM subject_offerings WHERE subject_offering_id LIKE '${DEMO_PREFIX}%' OR teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM grades WHERE teacher_id LIKE 'demo_teacher_%'`,
      `DELETE FROM students WHERE student_id LIKE 'demo_student_%'`,
      `DELETE FROM users WHERE userId LIKE 'demo_%'`,
      `DELETE FROM schools WHERE school_id LIKE 'demo_school_%'`,
    ];

    for (const statement of deleteStatements) {
      await run(db, statement);
    }

    const users = [];
    const grades = [];
    const offerings = [];
    const uploads = [];
    const assessmentResults = [];
    const plans = [];
    const sessions = [];
    const planItems = [];
    const planLogs = [];
    const quizzes = [];
    const assignments = [];
    const quizResults = [];
    const notifications = [];
    const tasks = [];
    const students = [];
    const schools = INSTITUTIONS.map((institution) => ({
      schoolId: institution.schoolId,
      schoolName: institution.schoolName,
      adminUserId: institution.institutionUserId,
      teacherJoinCode: institution.joinCode,
      teacherSelfRegistrationEnabled: 1,
    }));

    for (const institution of INSTITUTIONS) {
      users.push({
        userId: institution.institutionUserId,
        fullName: institution.institutionName,
        email: institution.institutionEmail,
        schoolId: institution.schoolId,
        roleId: 'Institution',
        passwordHash: passwordRow.passwordHash,
        isActive: 1,
        isVerified: 1,
      });

      const teacherUserIds = institution.teachers.map((teacher) => teacher.userId);

      notifications.push(
        {
          notificationId: `demo_notification_${institution.schoolId}_1`,
          schoolId: institution.schoolId,
          createdByUserId: institution.institutionUserId,
          title: 'متابعة الخطط الأسبوعية',
          message: 'أحسنتم. نرجو الاستمرار في تحديث إنجاز الحصص أولاً بأول قبل نهاية كل يوم دراسي.',
          recipientTeacherUserIds: JSON.stringify(teacherUserIds),
          senderRole: 'INSTITUTION',
          attachments: JSON.stringify([]),
          createdAt: iso(addDays(PRESENTATION_DATE, -6)),
        },
        {
          notificationId: `demo_notification_${institution.schoolId}_2`,
          schoolId: institution.schoolId,
          createdByUserId: institution.institutionUserId,
          title: 'تقدير لجهودكم',
          message: 'تمت ملاحظة تحسن واضح في الالتزام بالخطة الأسبوعية. شكرًا لجهودكم مع الطلبة.',
          recipientTeacherUserIds: JSON.stringify([]),
          senderRole: 'INSTITUTION',
          attachments: JSON.stringify([]),
          createdAt: iso(addDays(PRESENTATION_DATE, -3)),
        },
      );

      tasks.push(
        {
          taskId: `demo_task_${institution.schoolId}_1`,
          schoolId: institution.schoolId,
          createdByUserId: institution.institutionUserId,
          title: 'رفع ملخص الدعم الأسبوعي',
          description: 'يرجى رفع ملخص قصير عن تقدم الطلبة الضعاف وخطة المتابعة للأسبوع القادم.',
          assignedTeacherUserIds: JSON.stringify(teacherUserIds),
          attachments: JSON.stringify([]),
          dueDate: iso(addDays(PRESENTATION_DATE, 2)),
          status: 'OPEN',
          isHidden: 0,
          submissions: JSON.stringify(
            teacherUserIds.slice(0, Math.max(1, teacherUserIds.length - 1)).map(
              (teacherUserId) => ({
                teacherUserId,
                submittedAt: iso(addDays(PRESENTATION_DATE, -1)),
                message: 'تم رفع الملخص ومراجعة أبرز الملاحظات.',
                attachments: [],
              }),
            ),
          ),
          createdAt: iso(addDays(PRESENTATION_DATE, -4)),
        },
        {
          taskId: `demo_task_${institution.schoolId}_2`,
          schoolId: institution.schoolId,
          createdByUserId: institution.institutionUserId,
          title: 'مراجعة بنك الأسئلة',
          description: 'اختيار سؤالين مناسبين للصف الثالث من كل مادة وإرسال المقترحات للإدارة.',
          assignedTeacherUserIds: JSON.stringify(teacherUserIds),
          attachments: JSON.stringify([]),
          dueDate: iso(addDays(PRESENTATION_DATE, 4)),
          status: 'OPEN',
          isHidden: 0,
          submissions: JSON.stringify([]),
          createdAt: iso(addDays(PRESENTATION_DATE, -2)),
        },
      );

      institution.teachers.forEach((teacher, teacherIndex) => {
        users.push({
          userId: teacher.userId,
          fullName: teacher.fullName,
          email: teacher.email,
          schoolId: institution.schoolId,
          roleId: 'Teacher',
          passwordHash: passwordRow.passwordHash,
          isActive: 1,
          isVerified: 1,
        });

        grades.push({
          teacherId: teacher.userId,
          gradeId: 'Third Grade',
          gradeName: 'Third Grade',
          gradeSection: teacher.section,
          schoolName: institution.schoolName,
        });

        offerings.push(
          {
            subjectOfferingId: `demo_subject_offering_${teacher.userId}_1`,
            subjectId: '1',
            gradeId: 'Third Grade',
            teacherId: teacher.userId,
            schoolId: institution.schoolId,
            schoolYear: '2025-2026',
          },
          {
            subjectOfferingId: `demo_subject_offering_${teacher.userId}_2`,
            subjectId: '2',
            gradeId: 'Third Grade',
            teacherId: teacher.userId,
            schoolId: institution.schoolId,
            schoolYear: '2025-2026',
          },
        );

        notifications.push({
          notificationId: `demo_notification_teacher_${teacher.userId}`,
          schoolId: institution.schoolId,
          createdByUserId: teacher.userId,
          title: 'تحديث سريع',
          message: 'الخطة تسير بشكل جيد، وتمت متابعة الطلبة الضعاف وإسناد واجبات قصيرة لهم.',
          recipientTeacherUserIds: JSON.stringify([]),
          senderRole: 'TEACHER',
          attachments: JSON.stringify([]),
          createdAt: iso(addDays(PRESENTATION_DATE, -1)),
        });

        const weakStudentIds = [];

        for (let studentIndex = 0; studentIndex < teacher.studentCount; studentIndex += 1) {
          const globalStudentIndex = students.length;
          const studentId = `demo_student_${teacher.userId}_${studentIndex + 1}`;
          const isWeak = studentIndex < 4;
          const names = createStudentName(globalStudentIndex);
          let parentId;

          if (isWeak) {
            parentId = `demo_parent_${teacher.userId}_${studentIndex + 1}`;
            weakStudentIds.push(studentId);

            users.push({
              userId: parentId,
              fullName: `ولي أمر ${names.arabic}`,
              email: `guardian.${teacher.userId}.${studentIndex + 1}@gmail.com`,
              schoolId: institution.schoolId,
              roleId: 'Parent',
              passwordHash: passwordRow.passwordHash,
              isActive: 1,
              isVerified: 1,
            });
          }

          students.push({
            studentId,
            fullEnglishName: names.english,
            fullArabicName: names.arabic,
            nationalId: `9900${String(globalStudentIndex + 1).padStart(6, '0')}`,
            teacherId: teacher.userId,
            parentId: parentId ?? null,
            parentLinkCode: buildParentLinkCode(studentId),
            gradeId: 'Third Grade',
            schoolName: institution.schoolName,
            parentRelation: studentIndex % 2 === 0 ? 'Mother' : 'Father',
            isActive: 1,
          });

          ['1', '2'].forEach((subjectId) => {
            const uploadId = `demo_upload_${teacher.userId}_${subjectId}`;
            const skills = subjectSkillIds(subjectId);
            const basePercent = isWeak ? 28 : 82 - (studentIndex % 4) * 4;

            skills.forEach((skill, skillIndex) => {
              const percent = Math.max(15, Math.min(98, basePercent + skillIndex * 2));
              assessmentResults.push({
                resultId: `demo_result_${studentId}_${skill.id}`,
                uploadId,
                studentId,
                skillId: skill.id,
                totalScore: Math.max(
                  1,
                  Math.min(
                    skill.max,
                    Math.round((percent / 100) * skill.max),
                  ),
                ),
                level: levelForPercent(percent),
              });
            });
          });
        }

        uploads.push(
          {
            uploadId: `demo_upload_${teacher.userId}_1`,
            teacherId: teacher.userId,
            subjectId: '1',
            filePath: 'demo/math-baseline.xlsx',
            status: 'Processed',
            createdAt: iso(addDays(PRESENTATION_DATE, -18)),
          },
          {
            uploadId: `demo_upload_${teacher.userId}_2`,
            teacherId: teacher.userId,
            subjectId: '2',
            filePath: 'demo/arabic-baseline.xlsx',
            status: 'Processed',
            createdAt: iso(addDays(PRESENTATION_DATE, -17)),
          },
        );

        const mathPlan = buildPlanData(
          teacher,
          '1',
          Array.isArray(teacher.compressionDemoSubjects)
            && teacher.compressionDemoSubjects.includes('1')
            ? standardMathSequence
            : mathItems.slice((teacherIndex * 20) % Math.max(1, mathItems.length - 40)),
        );
        const arabicPlan = buildPlanData(
          teacher,
          '2',
          Array.isArray(teacher.compressionDemoSubjects)
            && teacher.compressionDemoSubjects.includes('2')
            ? standardArabicSequence
            : arabicItems.slice((teacherIndex * 20) % Math.max(1, arabicItems.length - 40)),
        );

        [mathPlan, arabicPlan].forEach((planBundle) => {
          plans.push(planBundle.plan);
          sessions.push(...planBundle.sessions);
          planItems.push(...planBundle.planItems);
          planLogs.push(...planBundle.planLogs);
        });

        const quizScenarios = [
          { subjectId: '1', statusMode: 'AUTO_GRADED', title: 'مراجعة العد حتى ١٠٠', skillFocus: 'skill_counting' },
          { subjectId: '1', statusMode: 'REVIEWED', title: 'أشرح خطوات الحل', skillFocus: 'skill_problem_solving' },
          { subjectId: '2', statusMode: 'AUTO_GRADED', title: 'تمييز الحروف والأصوات', skillFocus: 'skill_sounds_of_letters' },
          { subjectId: '2', statusMode: 'REVIEWED', title: 'أكتب جملة مفيدة', skillFocus: 'skill_writing' },
          { subjectId: '1', statusMode: 'PENDING_REVIEW', title: 'حل مسألة كلامية قصيرة', skillFocus: 'skill_problem_solving' },
          { subjectId: '2', statusMode: 'UNSUBMITTED', title: 'قراءة وفهم قصير', skillFocus: 'skill_vocal' },
        ];

        quizScenarios.forEach((scenario, quizIndex) => {
          const quizId = `demo_quiz_${teacher.userId}_${quizIndex + 1}`;
          const assignmentId = `demo_assignment_${teacher.userId}_${quizIndex + 1}`;
          const createdAt = addDays(PRESENTATION_DATE, -10 + quizIndex);
          const questions = buildQuestionSet(teacher.userId, scenario.subjectId, quizIndex + 1);
          const targetStudentIds = weakStudentIds.slice(0, 3);

          quizzes.push({
            quizId,
            teacherId: teacher.userId,
            subjectId: scenario.subjectId,
            skillFocus: scenario.skillFocus,
            supportProgramId: null,
            milestoneId: null,
            title: scenario.title,
            questionsJson: JSON.stringify(questions),
            createdAt: iso(createdAt),
          });

          assignments.push({
            assignmentId,
            teacherId: teacher.userId,
            subjectId: scenario.subjectId,
            title: scenario.title,
            type: 'QUIZ',
            sourceType: 'TEACHER_CREATED',
            sourceId: quizId,
            targetType: 'SELECTED_STUDENTS',
            targetStudentIdsJson: JSON.stringify(targetStudentIds),
            createdAt: iso(createdAt),
            dueDate: iso(addDays(createdAt, 4)),
            status: 'PUBLISHED',
          });

          if (scenario.statusMode === 'UNSUBMITTED') {
            return;
          }

          const resultStudents =
            scenario.statusMode === 'PENDING_REVIEW'
              ? targetStudentIds.slice(0, 1)
              : targetStudentIds.slice(0, 2);

          resultStudents.forEach((studentId, studentOffset) => {
            const answers = buildQuizResultAnswers(
              questions,
              scenario.statusMode,
              studentOffset,
            );
            const autoGradableAnswers = answers.filter(
              (answer) => typeof answer.isCorrect === 'boolean',
            );
            const score = autoGradableAnswers.length === 0
              ? 92
              : Math.round(
                  (autoGradableAnswers.filter((answer) => answer.isCorrect).length /
                    autoGradableAnswers.length) * 100,
                );

            quizResults.push({
              quizResultId: `demo_quiz_result_${teacher.userId}_${quizIndex + 1}_${studentOffset + 1}`,
              assignmentId,
              studentId,
              supportProgramId: null,
              milestoneId: null,
              quizId,
              score,
              status: scenario.statusMode,
              answersJson: JSON.stringify(answers),
              feedback:
                scenario.statusMode === 'REVIEWED'
                  ? 'إجابة جيدة. استمري في تنظيم الأفكار وشرح الخطوات.'
                  : null,
              submittedAt: iso(addDays(createdAt, 1)),
              reviewedAt:
                scenario.statusMode === 'REVIEWED'
                  ? iso(addDays(createdAt, 2))
                  : null,
            });
          });
        });
      });
    }

    for (const school of schools) {
      await run(
        db,
        `INSERT INTO schools (school_id, school_name, admin_user_id, teacher_join_code, teacher_self_registration_enabled)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(school_id) DO UPDATE SET
           school_name = excluded.school_name,
           admin_user_id = excluded.admin_user_id,
           teacher_join_code = excluded.teacher_join_code,
           teacher_self_registration_enabled = excluded.teacher_self_registration_enabled`,
        [
          school.schoolId,
          school.schoolName,
          school.adminUserId,
          school.teacherJoinCode,
          school.teacherSelfRegistrationEnabled,
        ],
      );
    }

    for (const user of users) {
      await run(
        db,
        `INSERT INTO users (userId, full_name, email, phoneNumber, schoolId, password_hash, role_id, is_active, is_verified)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
        [
          user.userId,
          user.fullName,
          user.email,
          user.schoolId,
          user.passwordHash,
          user.roleId,
          user.isActive,
          user.isVerified,
        ],
      );
    }

    for (const grade of grades) {
      await run(
        db,
        `INSERT INTO grades (grade_id, grade_name, grade_section, school_name, teacher_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          grade.gradeId,
          grade.gradeName,
          grade.gradeSection,
          grade.schoolName,
          grade.teacherId,
        ],
      );
    }

    for (const offering of offerings) {
      await run(
        db,
        `INSERT INTO subject_offerings (subject_offering_id, subject_id, grade_id, teacher_id, school_id, school_year)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          offering.subjectOfferingId,
          offering.subjectId,
          offering.gradeId,
          offering.teacherId,
          offering.schoolId,
          offering.schoolYear,
        ],
      );
    }

    for (const student of students) {
      await run(
        db,
        `INSERT INTO students (student_id, full_english_name, full_arabic_name, national_id, teacher_id, parent_id, parent_link_code, grade_id, school_name, parent_relation, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.studentId,
          student.fullEnglishName,
          student.fullArabicName,
          student.nationalId,
          student.teacherId,
          student.parentId,
          student.parentLinkCode,
          student.gradeId,
          student.schoolName,
          student.parentRelation,
          student.isActive,
        ],
      );
    }

    for (const upload of uploads) {
      await run(
        db,
        `INSERT INTO uploads (upload_id, teacher_id, subject_id, file_path, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          upload.uploadId,
          upload.teacherId,
          upload.subjectId,
          upload.filePath,
          upload.status,
          upload.createdAt,
        ],
      );
    }

    for (const result of assessmentResults) {
      await run(
        db,
        `INSERT INTO assessment_results (result_id, upload_id, student_id, skill_id, total_score, level)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          result.resultId,
          result.uploadId,
          result.studentId,
          result.skillId,
          result.totalScore,
          result.level,
        ],
      );
    }

    for (const plan of plans) {
      await run(
        db,
        `INSERT INTO plans (plan_id, plan_name, subject_id, start_date, total_weeks, teacher_id, sessions_json, auto_generated, plan_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.planId,
          plan.planName,
          plan.subjectId,
          iso(plan.startDate),
          plan.totalWeeks,
          plan.teacherId,
          JSON.stringify(plan.sessions),
          1,
          plan.planJson,
        ],
      );
    }

    for (const session of sessions) {
      await run(
        db,
        `INSERT INTO sessions (session_id, teacher_id, subject_id, day, items_json, max_duration, used_duration, review_buffer_minutes, slot_number, session_date, session_week_no)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session.sessionId,
          session.teacherId,
          session.subjectId,
          session.day,
          JSON.stringify(session.items),
          session.maxDuration,
          session.usedDuration,
          session.reviewBufferMinutes,
          session.slotNumber,
          iso(session.sessionDate),
          session.sessionWeekNo,
        ],
      );
    }

    for (const item of planItems) {
      await run(
        db,
        `INSERT INTO plan_items (plan_item_id, plan_id, session_id, curriculum_item_id, subject_id, title, unit_no, lesson_no, order_in_lesson, estimated_time, original_estimated_time, min_estimated_time, priority, is_compressible, status, original_session_id, original_session_order, carried_forward_count, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.planItemId,
          item.planId,
          item.sessionId,
          item.curriculumItemId,
          item.subjectId,
          item.title,
          item.unitNo,
          item.lessonNo,
          item.orderInLesson,
          item.estimatedTime,
          item.originalEstimatedTime,
          item.minEstimatedTime,
          item.priority,
          item.isCompressible ? 1 : 0,
          item.status,
          item.originalSessionId ?? null,
          item.originalSessionOrder ?? null,
          item.carriedForwardCount ?? 0,
          item.notes ?? null,
        ],
      );
    }

    for (const log of planLogs) {
      await run(
        db,
        `INSERT INTO plan_logs (plan_log_id, plan_id, session_id, plan_item_id, curriculum_item_id, action_type, description, created_at, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          log.planLogId,
          log.planId,
          log.sessionId,
          log.planItemId,
          log.curriculumItemId,
          log.actionType,
          log.description,
          log.createdAt,
          log.metadataJson,
        ],
      );
    }

    for (const quiz of quizzes) {
      await run(
        db,
        `INSERT INTO quizzes (quiz_id, teacher_id, subject_id, skill_focus, support_program_id, milestone_id, title, questions_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quiz.quizId,
          quiz.teacherId,
          quiz.subjectId,
          quiz.skillFocus,
          quiz.supportProgramId,
          quiz.milestoneId,
          quiz.title,
          quiz.questionsJson,
          quiz.createdAt,
        ],
      );
    }

    for (const assignment of assignments) {
      await run(
        db,
        `INSERT INTO assignments (assignment_id, teacher_id, subject_id, title, type, source_type, source_id, target_type, target_student_ids_json, created_at, due_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.assignmentId,
          assignment.teacherId,
          assignment.subjectId,
          assignment.title,
          assignment.type,
          assignment.sourceType,
          assignment.sourceId,
          assignment.targetType,
          assignment.targetStudentIdsJson,
          assignment.createdAt,
          assignment.dueDate,
          assignment.status,
        ],
      );
    }

    for (const result of quizResults) {
      await run(
        db,
        `INSERT INTO quiz_results (quiz_result_id, assignment_id, student_id, support_program_id, milestone_id, quiz_id, score, status, answers_json, feedback, submitted_at, reviewed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.quizResultId,
          result.assignmentId,
          result.studentId,
          result.supportProgramId,
          result.milestoneId,
          result.quizId,
          result.score,
          result.status,
          result.answersJson,
          result.feedback,
          result.submittedAt,
          result.reviewedAt,
        ],
      );
    }

    for (const notification of notifications) {
      await run(
        db,
        `INSERT INTO institution_notifications (notification_id, school_id, created_by_user_id, title, message, recipient_teacher_user_ids, sender_role, attachments, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.notificationId,
          notification.schoolId,
          notification.createdByUserId,
          notification.title,
          notification.message,
          notification.recipientTeacherUserIds,
          notification.senderRole,
          notification.attachments,
          notification.createdAt,
        ],
      );
    }

    for (const task of tasks) {
      await run(
        db,
        `INSERT INTO institution_tasks (task_id, school_id, created_by_user_id, title, description, assigned_teacher_user_ids, attachments, due_date, status, is_hidden, submissions, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.taskId,
          task.schoolId,
          task.createdByUserId,
          task.title,
          task.description,
          task.assignedTeacherUserIds,
          task.attachments,
          task.dueDate,
          task.status,
          task.isHidden,
          task.submissions,
          task.createdAt,
        ],
      );
    }

    await run(db, 'COMMIT');

    const summary = {
      institutions: INSTITUTIONS.length,
      teachers: INSTITUTIONS.reduce((sum, institution) => sum + institution.teachers.length, 0),
      students: students.length,
      parents: users.filter((user) => user.roleId === 'Parent').length,
      plans: plans.length,
      quizzes: quizzes.length,
      assignments: assignments.length,
      quizResults: quizResults.length,
      notifications: notifications.length,
      tasks: tasks.length,
      loginPassword: DEFAULT_PASSWORD_LABEL,
      institutionEmails: INSTITUTIONS.map((institution) => institution.institutionEmail),
      teacherEmails: INSTITUTIONS.flatMap((institution) =>
        institution.teachers.map((teacher) => teacher.email),
      ),
      compressionDemoTeacherEmails: INSTITUTIONS.flatMap((institution) =>
        institution.teachers
          .filter((teacher) => Array.isArray(teacher.compressionDemoSubjects) && teacher.compressionDemoSubjects.length > 0)
          .map((teacher) => teacher.email),
      ),
      bufferDemoTeacherEmails: INSTITUTIONS.flatMap((institution) =>
        institution.teachers
          .filter((teacher) => Array.isArray(teacher.bufferDemoSubjects) && teacher.bufferDemoSubjects.length > 0)
          .map((teacher) => teacher.email),
      ),
    };

    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    try {
      await run(db, 'ROLLBACK');
    } catch {}

    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await close(db);
  }
}

seedDemoData();
