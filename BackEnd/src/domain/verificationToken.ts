import { UserId, VerificationTokenId } from './ids';

export enum VerificationTokenType {
  EMAIL_VERIFICATION = 'EmailVerification',
  PASSWORD_RESET = 'PasswordReset',
}

export class VerificationToken {
  verificationTokenId: VerificationTokenId;
  userId: UserId;
  tokenHash: string;
  type: VerificationTokenType;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
}
