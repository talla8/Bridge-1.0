import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Student } from 'src/domain/student';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import { ids } from 'src/domain/ids'; //try and fix this

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}
  @Roles([RoleId.Admin, RoleId.Teacher])
  @Post('createMany')
  async createMany(@Body() students: CreateStudentDTO[]): Promise<Student[]> {
    return this.studentsService.createMany(students);
  }

  @Get('myStudents')
  async getStudents(userId: ids.UserId): Promise<Student[]> {
    return this.studentsService.getStudents(userId);
  }

  //add:
  //get students by id
  @Get('findOne')
  async getById(studentId: ids.StudentId): Promise<Student> {
    return this.studentsService.getById(studentId);
  }

  @Roles([RoleId.Admin, RoleId.Teacher])
  @Patch('update')
  async updateStudent(
    studentId: ids.StudentId,
    patch: Partial<Student>,
  ): Promise<Student> {
    return this.studentsService.updateStudent(studentId, patch);
  }
}
