import { Body, Controller, Get, Patch, Post, Req, Param } from '@nestjs/common';
import { Student } from 'src/domain/student';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import type { StudentId } from 'src/domain/ids'; //try and fix this

@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}
  @Roles([RoleId.ADMIN, RoleId.TEACHER])
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
  @Get('findOne/:studentId')
  async getById(@Param('studntId') studentId: StudentId): Promise<Student> {
    return this.studentsService.getById(studentId);
  }

  @Roles([RoleId.ADMIN, RoleId.TEACHER])
  @Patch('update/:studentId')
  async updateStudent(
    @Param('studentId')
    studentId: StudentId,
    patch: Partial<Student>,
  ): Promise<Student> {
    return this.studentsService.updateStudent(studentId, patch);
  }
}
