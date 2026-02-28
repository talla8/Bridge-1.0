import { Module } from '@nestjs/common';
import { BaselineController } from './baseline.controller';

@Module({
  controllers: [BaselineController]
})
export class BaselineModule {}
