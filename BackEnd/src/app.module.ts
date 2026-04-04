import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MockSeedBootstrapService } from './seeding/mock-seed.bootstrap.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { BaselineModule } from './baseline/baseline.module';
import { PlansModule } from './plans/plans.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ConfigModule } from '@nestjs/config';
import { InMemoryReposModule } from './infrastructure/in-memory/in-memory-repos.module'; 
import { StudentUploadService } from './students/student-upload.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'BackEnd/.env'],
    }),
    AuthModule,
    UsersModule,
    StudentsModule,
    BaselineModule,
    PlansModule,
    StatisticsModule,
    InMemoryReposModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MockSeedBootstrapService,
    StudentUploadService,
  ],
})
export class AppModule {}
