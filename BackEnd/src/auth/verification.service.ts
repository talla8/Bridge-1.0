import {
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { createHash, randomUUID } from 'crypto';
import { UserId } from 'src/domain/ids';
import {
  VerificationToken,
  VerificationTokenType,
} from 'src/domain/verificationToken';
import { InMemoryVerificationTokensRepo } from 'src/infrastructure/in-memory/in-memory-verificationToken.repo';

@Injectable()
export class VerificationService {
  private readonly resendCooldownMs = 60 * 1000;
  private readonly tokenLifetimeMs = 10 * 60 * 1000;
  private readonly mailTimeoutMs = 8000;

  constructor(
    private readonly tokenRepo: InMemoryVerificationTokensRepo,
    private readonly mailerService: MailerService,
  ) {}

  async generateOTP(
    userId: UserId,
    type: VerificationTokenType = VerificationTokenType.EMAIL_VERIFICATION,
  ): Promise<string> {
    const recentToken = await this.tokenRepo.findLatestByUserId(userId);

    if (recentToken && recentToken.type === type) {
      const elapsedMs = Date.now() - recentToken.createdAt.getTime();

      if (elapsedMs < this.resendCooldownMs) {
        const waitSeconds = Math.ceil(
          (this.resendCooldownMs - elapsedMs) / 1000,
        );
        throw new HttpException(
          `Please wait ${waitSeconds} seconds before requesting another verification code.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const now = new Date();
    const token: VerificationToken = {
      verificationTokenId: `verification_${randomUUID()}`,
      userId,
      tokenHash: this.hashToken(otp),
      type,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.tokenLifetimeMs),
    };

    await this.tokenRepo.create(token);

    return otp;
  }

  async sendEmail(userId: UserId, emailAddress: string): Promise<string> {
    const otp = await this.generateOTP(
      userId,
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    await this.sendMailWithTimeout({
      to: emailAddress,
      subject: 'Verify your email',
      text: `Your verification code is: ${otp}`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p>`,
    });

    return 'Verification email sent successfully.';
  }

  async sendPasswordResetEmail(
    userId: UserId,
    emailAddress: string,
  ): Promise<string> {
    const otp = await this.generateOTP(
      userId,
      VerificationTokenType.PASSWORD_RESET,
    );
    await this.sendMailWithTimeout({
      to: emailAddress,
      subject: 'Reset your password',
      text: `Your password reset code is: ${otp}`,
      html: `<p>Your password reset code is: <strong>${otp}</strong></p>`,
    });

    return 'Password reset email sent successfully.';
  }

  async findTokenOwner(
    token: string,
    type: VerificationTokenType,
  ): Promise<UserId | null> {
    const hashedToken = this.hashToken(token);
    const storedToken = await this.tokenRepo.findByTokenHash(hashedToken);

    if (!storedToken || storedToken.type !== type) {
      return null;
    }

    if (storedToken.usedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      return null;
    } //comment :  why dont i use consumetoken here?

    return storedToken.userId;
  }

  async consumeToken(
    userId: UserId,
    token: string,
    type: VerificationTokenType,
  ): Promise<boolean> {
    const hashedToken = this.hashToken(token);
    const storedToken = await this.tokenRepo.findByTokenHash(hashedToken);

    if (
      !storedToken ||
      storedToken.userId !== userId ||
      storedToken.type !== type
    ) {
      return false;
    }

    if (storedToken.usedAt || storedToken.expiresAt.getTime() <= Date.now()) {
      return false;
    }

    await this.tokenRepo.update(storedToken.verificationTokenId, {
      usedAt: new Date(),
    });

    return true;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendMailWithTimeout(payload: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    try {
      await Promise.race([
        this.mailerService.sendMail(payload),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new ServiceUnavailableException(
                  'Email delivery timed out. Please check the mail configuration and try again.',
                ),
              ),
            this.mailTimeoutMs,
          ),
        ),
      ]);
    } catch (error) {
      console.error('Verification mail send failed:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'Unable to send email right now. Please check the mail configuration and try again.',
      );
    }
  }
}
