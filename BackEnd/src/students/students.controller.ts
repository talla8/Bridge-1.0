import { Body, Controller, Get, Patch, Post, Req } from '@nestjs/common';
import { Student } from 'src/domain/student';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import type { UserId, StudentId } from 'src/domain/ids'; //try and fix this

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}
  @Roles([RoleId.Admin, RoleId.Teacher])
  @Post('createMany')
  async createMany(@Body() students: CreateStudentDTO[]): Promise<Student[]> {
    return this.studentsService.createMany(students);
  }

  @Get('myStudents')
  async getStudents(@Req() req): Promise<Student[]> {
  console.log('req.user =', req.user);
  return this.studentsService.getStudents(req.user.sub);
  }

  //add:
  //get students by id
  @Get('findOne')
  async getById(studentId: StudentId): Promise<Student> {
    return this.studentsService.getById(studentId);
  }

  @Roles([RoleId.Admin, RoleId.Teacher])
  @Patch('update')
  async updateStudent(
    studentId: StudentId,
    patch: Partial<Student>,
  ): Promise<Student> {
    return this.studentsService.updateStudent(studentId, patch);
  }
}
