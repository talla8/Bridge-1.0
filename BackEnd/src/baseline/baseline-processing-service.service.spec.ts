import { Test, TestingModule } from '@nestjs/testing';
import { BaselineProcessingServiceService } from './baseline-processing-service.service';

describe('BaselineProcessingServiceService', () => {
  let service: BaselineProcessingServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaselineProcessingServiceService],
    }).compile();

    service = module.get<BaselineProcessingServiceService>(BaselineProcessingServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
