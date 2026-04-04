import { Test, TestingModule } from '@nestjs/testing';
import { StudentUploadService } from './student-upload.service';

describe('StudentUploadService', () => {
  let service: StudentUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentUploadService],
    }).compile();

    service = module.get<StudentUploadService>(StudentUploadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
