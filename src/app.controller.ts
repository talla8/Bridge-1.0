import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    // private readonly test: InMemoryUsersRepo,
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
