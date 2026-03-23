import { Injectable } from '@nestjs/common';
import { VerificationToken } from 'src/domain/verificationToken';
import { VerificationTokenRepository } from 'src/repositories/verificationToken.repository';

@Injectable()
export class InMemoryVerificationTokensRepo
  implements VerificationTokenRepository
{
  private tokens: VerificationToken[] = [];

  async create(token: VerificationToken): Promise<VerificationToken> {
    this.tokens.push(token);
    return token;
  }

  async findById(id: string): Promise<VerificationToken | null> {
    return (
      this.tokens.find(
        (token: VerificationToken): boolean =>
          token.verificationTokenId === id,
      ) ?? null
    );
  }

  async findByTokenHash(tokenHash: string): Promise<VerificationToken | null> {
    return (
      this.tokens.find(
        (token: VerificationToken): boolean => token.tokenHash === tokenHash,
      ) ?? null
    );
  }

  async findAll(): Promise<VerificationToken[]> {
    return this.tokens;
  }

  async findLatestByUserId(userId: string): Promise<VerificationToken | null> {
    const userTokens = this.tokens
      .filter((token: VerificationToken): boolean => token.userId === userId)
      .sort(
        (a: VerificationToken, b: VerificationToken): number =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      );

    return userTokens[0] ?? null;
  }

  async findActiveByUserId(userId: string): Promise<VerificationToken | null> {
    const now = Date.now();
    const userTokens = this.tokens
      .filter(
        (token: VerificationToken): boolean =>
          token.userId === userId &&
          !token.usedAt &&
          token.expiresAt.getTime() > now,
      )
      .sort(
        (a: VerificationToken, b: VerificationToken): number =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      );

    return userTokens[0] ?? null;
  }

  async update(
    id: string,
    patch: Partial<VerificationToken>,
  ): Promise<VerificationToken | null> {
    const index = this.tokens.findIndex(
      (token: VerificationToken): boolean => token.verificationTokenId === id,
    );
    if (index === -1) return null;

    const updated: VerificationToken = { ...this.tokens[index], ...patch };
    this.tokens[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.tokens.findIndex(
      (token: VerificationToken): boolean => token.verificationTokenId === id,
    );
    if (index === -1) return false;

    this.tokens.splice(index, 1);
    return true;
  }
}
