import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Param,
  Res,
  ParseFilePipeBuilder,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';
import { Student } from 'src/domain/student';
import { StudentsService } from './students.service';
import { CreateStudentDTO } from './DTO/create.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RoleId } from 'src/domain/user';
import type { StudentId } from 'src/domain/ids'; //try and fix this
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentUploadService } from './student-upload.service';

@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly studentUploadService: StudentUploadService,
  ) {}

  @Get('download-template')
  downloadStudentsNamesTemplate(@Res() res: Response): void {
    const templatePath = join(
      process.cwd(),
      'src',
      'assets',
      'student_upload_template.xlsx',
    ); //يعني جيب من هاد الباث
    res.download(templatePath, 'student_upload_template.xlsx');
  }

  @Roles([RoleId.ADMIN, RoleId.TEACHER])
  @Post('import-template')
  @UseInterceptors(FileInterceptor('file'))
  async uploadStudentsInfo(
    @Req() req,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        .build(),
    )
    file: Express.Multer.File,
  ): Promise<Student[]> {
    return this.studentUploadService.importStudents(file, req.user.sub);
  } //comment: should i replace this with the create method directly?

  @Roles([RoleId.ADMIN, RoleId.TEACHER])
  @Post('createMany')
  async createMany(@Body() students: CreateStudentDTO[]): Promise<Student[]> {
    return this.studentsService.createMany(students);
  }

  @Get('myStudents')
  async getStudents(@Req() req): Promise<Student[]> {
    return this.studentsService.getStudents(req.user.sub);
  }

  //add:
  //get students by id
  @Get('findOne/:studentId')
  async getById(@Req() req, @Param('studentId') studentId: StudentId) {
    return this.studentsService.getProfile(req.user.sub, studentId);
  }

  @Roles([RoleId.ADMIN, RoleId.TEACHER])
  @Patch('update/:studentId')
  async updateStudent(
    @Param('studentId')
    studentId: StudentId,
    @Body()
    patch: Partial<Student>,
  ): Promise<Student> {
    return this.studentsService.updateStudent(studentId, patch);
  }
}
