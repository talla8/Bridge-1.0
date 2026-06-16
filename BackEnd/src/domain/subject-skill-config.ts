import { SkillId, SubjectId } from './ids';

export type BaselineScoreField =
  | 'vocal'
  | 'soundsOfLetters'
  | 'writing'
  | 'counting'
  | 'numberManipulation'
  | 'problemSolving';

export type SubjectSkillDefinition = {
  field: BaselineScoreField;
  skillId: SkillId;
  maxScore: number;
  title: string;
  headerAliases: string[];
};

export const DEFAULT_SUBJECT_ID: SubjectId = '2';

export const SUBJECT_SKILL_DEFINITIONS: Record<
  SubjectId,
  SubjectSkillDefinition[]
> = {
  '1': [
    {
      field: 'counting',
      skillId: 'skill_counting',
      maxScore: 5,
      title: 'Counting Skills',
      headerAliases: ['مهارات العد [5]', 'مهارات العد (5)', 'مهارات العد'],
    },
    {
      field: 'numberManipulation',
      skillId: 'skill_number_manipulation',
      maxScore: 12,
      title: 'Number Manipulation',
      headerAliases: [
        'مهارات التلاعب بالأعداد [12]',
        'مهارات التلاعب بالاعداد [12]',
        'مهارات التلاعب بالأعداد (12)',
        'مهارات التلاعب بالاعداد (12)',
        'مهارات التلاعب بالأعداد',
        'مهارات التلاعب بالاعداد',
      ],
    },
    {
      field: 'problemSolving',
      skillId: 'skill_problem_solving',
      maxScore: 7,
      title: 'Problem Solving',
      headerAliases: [
        'مهارات حل المسائل [7]',
        'مهارات حل المسائل (7)',
        'مهارات حل المسائل',
      ],
    },
  ],
  '2': [
    {
      field: 'vocal',
      skillId: 'skill_vocal',
      maxScore: 6,
      title: 'Vocal Awareness',
      headerAliases: ['الوعي الصوتي (6)', 'الوعي الصوتي [6]', 'الوعي الصوتي'],
    },
    {
      field: 'soundsOfLetters',
      skillId: 'skill_sounds_of_letters',
      maxScore: 8,
      title: 'Sounds of Letters',
      headerAliases: [
        'قراءة أصوات الحروف (8)',
        'قراءة أصوات الحروف [8]',
        'قراءة اصوات الحروف (8)',
        'قراءة اصوات الحروف [8]',
        'قراءة أصوات الحروف',
        'قراءة اصوات الحروف',
      ],
    },
    {
      field: 'writing',
      skillId: 'skill_writing',
      maxScore: 4,
      title: 'Writing',
      headerAliases: ['الكتابة (4)', 'الكتابة [4]', 'الكتابة'],
    },
  ],
};

export const COMMON_BASELINE_HEADERS = {
  serialNo: ['الرقم المتسلسل', 'الرقم التسلسلي'],
  studentName: ['اسم الطالب'],
  totalScore: ['المجموع الكلي %', 'المجموع الكلي [%]', 'المجموع الكلي'],
} as const;

export function getSubjectSkillDefinitions(
  subjectId?: SubjectId,
): SubjectSkillDefinition[] {
  return SUBJECT_SKILL_DEFINITIONS[String(subjectId || DEFAULT_SUBJECT_ID)] ??
    SUBJECT_SKILL_DEFINITIONS[DEFAULT_SUBJECT_ID];
}

export function normalizeBaselineHeaderValue(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .replace(/٪/g, '%')
    .toLowerCase();
}
