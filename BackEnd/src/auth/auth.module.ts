import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { InMemoryReposModule } from 'src/infrastructure/in-memory/in-memory-repos.module';
import { VerificationService } from './verification.service';
import { RolesGuard } from './roles.guard';
import { MailerModule } from '@nestjs-modules/mailer';
import { StudentsModule } from 'src/students/students.module';

@Module({
  imports: [
    UsersModule,
    StudentsModule,
    ConfigModule,
    InMemoryReposModule,
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: Number(configService.get<string>('MAIL_PORT') ?? 587),
          secure: configService.get<string>('MAIL_SECURE') === 'true',
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from:
            configService.get<string>('MAIL_FROM') ??
            configService.get<string>('MAIL_USER'),
        },
      }),
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is missing.');
        }

        return {
          secret,
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    VerificationService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
