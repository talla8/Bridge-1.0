import { Test, TestingModule } from '@nestjs/testing';
import { BaselineController } from './baseline.controller';

describe('BaselineController', () => {
  let controller: BaselineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaselineController],
    }).compile();

    controller = module.get<BaselineController>(BaselineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
