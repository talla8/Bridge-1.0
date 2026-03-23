import { Test, TestingModule } from '@nestjs/testing';
import { StudentMatchingServiceService } from './student-matching-service.service';

describe('StudentMatchingServiceService', () => {
  let service: StudentMatchingServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentMatchingServiceService],
    }).compile();

    service = module.get<StudentMatchingServiceService>(StudentMatchingServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
