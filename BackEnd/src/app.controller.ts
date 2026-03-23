import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InMemoryUsersRepo } from './infrastructure/in-memory/in-memory-user.repo';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly test: InMemoryUsersRepo,
  ) {}

  // @Get()
  // async checkeverything() {
  //   return this.test.findByEmail('tala@example.com');
  // }

  // @Get('/s')
  // async testingRoutes(){
  //   return true;
  // }
}
