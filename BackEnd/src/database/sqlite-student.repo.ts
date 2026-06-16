import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from 'src/domain/student';
import { StudentRepository } from 'src/repositories/student.repository';
import { StudentEntity } from './entities/student.entity';

@Injectable()
export class SqliteStudentsRepo implements StudentRepository {
  constructor(
    @InjectRepository(StudentEntity)
    private readonly repository: Repository<StudentEntity>,
  ) {}

  async create(student: Student): Promise<Student> {
    const entity = this.repository.create(this.normalizeStudent(student));
    return this.repository.save(entity);
  }

  async createMany(students: Student[]): Promise<Student[]> {
    const savedStudents: Student[] = [];

    for (const student of students) {
      const normalizedStudent = this.normalizeStudent(student);
      const existing = await this.findById(normalizedStudent.studentId);
      if (existing) {
        const merged = this.repository.merge(
          this.repository.create(existing),
          normalizedStudent as Partial<StudentEntity>,
        );
        savedStudents.push(await this.repository.save(merged));
        continue;
      }

      const entity = this.repository.create(normalizedStudent);
      savedStudents.push(await this.repository.save(entity));
    }

    return savedStudents;
  }

  async findById(id: string): Promise<Student | null> {
    return this.repository.findOneBy({ studentId: String(id) });
  }

  async findByParentLinkCode(parentLinkCode: string): Promise<Student | null> {
    return this.repository.findOneBy({ parentLinkCode: String(parentLinkCode) });
  }

  async findByArabicName(name: string): Promise<Student[]> {
    return this.repository.findBy({ fullArabicName: String(name) });
  }

  async findAll(): Promise<Student[]> {
    return this.repository.find();
  }

  async findByParentId(parentId: string): Promise<Student[]> {
    return this.repository.findBy({ parentId: String(parentId) });
  }

  async findByTeacherId(teacherId: string): Promise<Student[]> {
    return this.repository.findBy({ teacherId: String(teacherId) });
  }

  async findByGradeId(gradeId: string): Promise<Student[]> {
    return this.repository.findBy({ gradeId: String(gradeId) });
  }

  async update(id: string, patch: Partial<Student>): Promise<Student | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const normalizedPatch = this.normalizeStudentPatch(patch);
    const merged = this.repository.merge(
      this.repository.create(existing),
      normalizedPatch as Partial<StudentEntity>,
    );
    return this.repository.save(merged);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await this.repository.delete({ studentId: String(id) });
    return true;
  }

  private normalizeStudent(student: Student): Student {
    return {
      ...student,
      studentId: String(student.studentId),
      teacherId:
        student.teacherId === undefined || student.teacherId === null
          ? undefined
          : String(student.teacherId),
      parentId:
        student.parentId === undefined || student.parentId === null
          ? undefined
          : String(student.parentId),
      gradeId: String(student.gradeId),
      schoolName:
        student.schoolName === undefined || student.schoolName === null
          ? undefined
          : String(student.schoolName),
      nationalId: String(student.nationalId),
      parentLinkCode: String(student.parentLinkCode),
    };
  }

  private normalizeStudentPatch(patch: Partial<Student>): Partial<Student> {
    return {
      ...patch,
      teacherId:
        patch.teacherId === undefined || patch.teacherId === null
          ? patch.teacherId
          : String(patch.teacherId),
      parentId:
        patch.parentId === undefined || patch.parentId === null
          ? patch.parentId
          : String(patch.parentId),
      gradeId:
        patch.gradeId === undefined || patch.gradeId === null
          ? patch.gradeId
          : String(patch.gradeId),
      schoolName:
        patch.schoolName === undefined || patch.schoolName === null
          ? patch.schoolName
          : String(patch.schoolName),
      nationalId:
        patch.nationalId === undefined
          ? patch.nationalId
          : String(patch.nationalId),
      parentLinkCode:
        patch.parentLinkCode === undefined
          ? patch.parentLinkCode
          : String(patch.parentLinkCode),
    };
  }
}
