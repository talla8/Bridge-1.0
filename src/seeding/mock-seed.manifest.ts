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
  exercises: 'exercises.json',
  plans: 'plans.json',
  attendance: 'attendance.json',
  assessmentResults: 'assessment_results.json',
  skillExercises: 'skill_exercises.json',
  planLogs: 'plan_log.json',
} as const;

export type MockSeedEntity = keyof typeof mockSeedManifest;
