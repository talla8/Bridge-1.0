export const mockSeedManifest = {
  admins: 'admin.json',
  users: 'user.json',
  parents: 'parent.json',
  teachers: 'teacher.json',
  schools: 'schools.json',
  grades: 'grade.json',
  subjects: 'subjects.json',
  subjectOfferings: 'subject_offerings.json',
  students: 'students.json',
  uploads: 'uploads.json',
  skills: 'skills.json',
  curriculumItems: 'exercises.json',
  plans: 'plans.json',
  attendance: 'attendance.json',
  assessmentResults: 'assessment_results.json',
  skillCurriculumItems: 'skill_exercises.json',
  supportPrograms: 'support-program-items.json',
  planLogs: 'plan_log.json',
} as const;

export type MockSeedEntity = keyof typeof mockSeedManifest;
