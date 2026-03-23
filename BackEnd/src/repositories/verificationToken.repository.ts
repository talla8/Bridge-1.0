import { VerificationToken } from 'src/domain/verificationToken';

export interface VerificationTokenRepository {
  create(token: VerificationToken): Promise<VerificationToken>;
  findById(id: string): Promise<VerificationToken | null>;
  findByTokenHash(tokenHash: string): Promise<VerificationToken | null>;
  findAll(): Promise<VerificationToken[]>;
  findLatestByUserId(userId: string): Promise<VerificationToken | null>;
  findActiveByUserId(userId: string): Promise<VerificationToken | null>;
  update(
    id: string,
    patch: Partial<VerificationToken>,
  ): Promise<VerificationToken | null>;
  delete(id: string): Promise<boolean>;
}
