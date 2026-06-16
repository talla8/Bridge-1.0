import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ParentRelation, Student } from 'src/domain/student';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { CreateStudentDTO } from './DTO/create.dto';
import { StudentId, UserId } from 'src/domain/ids';
import { RoleId } from 'src/domain/user';
import { SqliteGradesRepo } from 'src/database/sqlite-grade.repo';
import { SqliteStudentsRepo } from 'src/database/sqlite-student.repo';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly inMemoryStudentsRepo: InMemoryStudentsRepo,
    private readonly sqliteStudentsRepo: SqliteStudentsRepo,
    private readonly usersService: UsersService,
    private readonly gradesRepo: SqliteGradesRepo,
  ) {}

  async createMany(
    students: CreateStudentDTO[],
    owner?: { teacherId?: UserId; schoolName?: string | null },
  ): Promise<Student[]> {
    const createdAt = Date.now(); //we dont have a createdAt filed in students we are creating this only for the id
    const mappedStudents: Student[] = students.map(
      (student: CreateStudentDTO, index: number): Student => ({
        studentId: `stu_${createdAt}_${index + 1}`, //check this if working apply it to other places
        fullEnglishName: student.fullEnglishName,
        fullArabicName: student.fullArabicName,
        nationalId: student.nationalId,
        teacherId: owner?.teacherId,
        // Temporary defaults for MVP while DTO is minimal.
        parentId: undefined,
        parentLinkCode: this.generateParentLinkCode(),
        gradeId: student.grade,
        schoolName: owner?.schoolName ?? '', //must be associated with the teacher
        parentRelation: ParentRelation.GUARDIAN, //Default //see a way to chnge it while creating a parents account
        isActive: true,
      }),
    );

    const savedStudents = await this.sqliteStudentsRepo.createMany(mappedStudents);
    await this.inMemoryStudentsRepo.createMany(savedStudents);
    return savedStudents; //this method is the one actually creting the students
    //in the repo, the prev code is for transforming the array from a createDTO array into a students array
  }
  async getStudents(userId: UserId): Promise<Student[]> {
    //we should find the user from users
    //or we should find all students with the same gradeId or parent id
    //we should determine the role or the user first:
    const user = await this.usersService.findById(userId);
    if (user?.roleId === RoleId.PARENT) {
      return this.findByParentId(userId);
    } else if (user?.roleId === RoleId.TEACHER) {
      const ownedStudents = await this.findByTeacherId(userId);
      if (ownedStudents.length > 0) {
        return ownedStudents;
      }

      const grade = await this.gradesRepo.findByTeacherId(userId);
      if (!grade) return [];
      const gradeStudents = await this.findByGradeId(grade?.gradeId);
      return gradeStudents.filter((student) => {
        if (student.teacherId) {
          return String(student.teacherId) === String(userId);
        }

        if (grade.schoolName && student.schoolName) {
          return String(student.schoolName) === String(grade.schoolName);
        }

        return false;
      });
    } else {
      throw new UnauthorizedException();
    }
  } //might have a problem when we dont return an array

  async getProfile(userId: UserId, studentId: StudentId): Promise<Student> {
    const student = await this.getById(studentId);
    const accessibleStudents = await this.getStudents(userId);
    const canAccessStudent = accessibleStudents.some(
      (item) => item.studentId === student.studentId,
    );

    if (!canAccessStudent) {
      throw new UnauthorizedException();
    }

    return student;
  }

  async updateStudent(
    studentId: StudentId,
    patch: Partial<Student>,
  ): Promise<Student> {
    const updated = await this.sqliteStudentsRepo.update(studentId, patch);
    if (!updated) throw new NotFoundException('Student not found');
    const inMemoryExisting = await this.inMemoryStudentsRepo.findById(studentId);
    if (inMemoryExisting) {
      await this.inMemoryStudentsRepo.update(studentId, patch);
    } else {
      await this.inMemoryStudentsRepo.create(updated);
    }
    return updated;
  }

  async getById(studentId: StudentId): Promise<Student> {
    const student = await this.findByIdOrNull(studentId);
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async findByIdOrNull(studentId: StudentId): Promise<Student | null> {
    const student =
      (await this.sqliteStudentsRepo.findById(studentId)) ??
      (await this.inMemoryStudentsRepo.findById(studentId));
    if (!student) return null;
    await this.ensureInMemory(student);
    return student;
  }

  async findByArabicName(name: string): Promise<Student[]> {
    const students = await this.sqliteStudentsRepo.findByArabicName(name);
    if (!students.length) {
      return this.inMemoryStudentsRepo.findByArabicName(name);
    }

    await this.ensureInMemoryMany(students);
    return students;
  }

  async findAll(): Promise<Student[]> {
    const students = await this.sqliteStudentsRepo.findAll();
    if (!students.length) {
      return this.inMemoryStudentsRepo.findAll();
    }

    await this.ensureInMemoryMany(students);
    return students;
  }

  async findByParentLinkCode(parentLinkCode: string): Promise<Student | null> {
    const student =
      (await this.sqliteStudentsRepo.findByParentLinkCode(parentLinkCode)) ??
      (await this.inMemoryStudentsRepo.findByParentLinkCode(parentLinkCode));
    if (!student) return null;

    await this.ensureInMemory(student);
    return student;
  }

  private generateParentLinkCode(): string {
    return `PARENT-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async findByParentId(parentId: UserId): Promise<Student[]> {
    const students = await this.sqliteStudentsRepo.findByParentId(parentId);
    if (!students.length) {
      return this.inMemoryStudentsRepo.findByParentId(parentId);
    }

    await this.ensureInMemoryMany(students);
    return students;
  }

  private async findByTeacherId(teacherId: UserId): Promise<Student[]> {
    const students = await this.sqliteStudentsRepo.findByTeacherId(teacherId);
    if (!students.length) {
      return this.inMemoryStudentsRepo.findByTeacherId(teacherId);
    }

    await this.ensureInMemoryMany(students);
    return students;
  }

  private async findByGradeId(gradeId: string): Promise<Student[]> {
    const students = await this.sqliteStudentsRepo.findByGradeId(gradeId);
    if (!students.length) {
      return this.inMemoryStudentsRepo.findByGradeId(gradeId);
    }

    await this.ensureInMemoryMany(students);
    return students;
  }

  private async ensureInMemory(student: Student): Promise<void> {
    if (!(await this.inMemoryStudentsRepo.findById(student.studentId))) {
      await this.inMemoryStudentsRepo.create(student);
    }
  }

  private async ensureInMemoryMany(students: Student[]): Promise<void> {
    for (const student of students) {
      await this.ensureInMemory(student);
    }
  }
}
