import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ParentRelation, Student } from 'src/domain/student';
import { InMemoryStudentsRepo } from 'src/infrastructure/in-memory/in-memory-student.repo';
import { CreateStudentDTO } from './DTO/create.dto';
import { StudentId, UserId } from 'src/domain/ids';
import { InMemoryUsersRepo } from 'src/infrastructure/in-memory/in-memory-user.repo';
import { RoleId } from 'src/domain/user';
import { InMemoryGradesRepo } from 'src/infrastructure/in-memory/in-memory-grade.repo';

@Injectable()
export class StudentsService {
  constructor(
    private readonly inMemoryStudentsRepo: InMemoryStudentsRepo,
    private readonly inMemoryUsersRepo: InMemoryUsersRepo,
    private readonly inMemoryGradeRepo: InMemoryGradesRepo,
  ) {}

  async createMany(students: CreateStudentDTO[]): Promise<Student[]> {
    const createdAt = Date.now(); //we dont have a createdAt filed in students we are creating this only for the id
    const mappedStudents: Student[] = students.map(
      (student: CreateStudentDTO, index: number): Student => ({
        studentId: `stu_${createdAt}_${index + 1}`, //check this if working apply it to other places
        fullName: student.fullName,
        // Temporary defaults for MVP while DTO is minimal.
        parentId: '', //also when creating a student
        gradeId: student.grade,
        schoolId: '', //must be associated with the teacher
        parentRelation: ParentRelation.GUARDIAN, //Default //see a way to chnge it while creating a parents account
        isActive: true,
      }),
    );

    return this.inMemoryStudentsRepo.createMany(mappedStudents); //this method is the one actually creting the students
    //in the repo, the prev code is for transforming the array from a createDTO array into a students array
  }
  async getStudents(userId: UserId): Promise<Student[]> {
    //we should find the user from users
    //or we should find all students with the same gradeId or parent id
    //we should determine the role or the user first:
      console.log('userId =', userId);
    const user = await this.inMemoryUsersRepo.findById(userId);
      console.log('found user =', user);
    if (user?.roleId === RoleId.Parent) {
      return this.inMemoryStudentsRepo.findByParentId(userId);
    } else if (user?.roleId === RoleId.Teacher) {
      const grade = await this.inMemoryGradeRepo.findByTeacherId(userId);
          console.log('found grade =', grade);
      if (!grade) return [];
      return this.inMemoryStudentsRepo.findByGradeId(grade?.gradeId);
    } else {
      throw new UnauthorizedException();
    }
  } //might have a problem when we dont return an array

  async updateStudent(
    studentId: StudentId,
    patch: Partial<Student>,
  ): Promise<Student> {
    const updated = await this.inMemoryStudentsRepo.update(studentId, patch);
    if (!updated) throw new NotFoundException('Student not found');
    return updated;
  }

  async getById(studentId: StudentId): Promise<Student> {
    const student = await this.inMemoryStudentsRepo.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }
}
