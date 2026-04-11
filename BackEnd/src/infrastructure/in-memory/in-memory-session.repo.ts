import { Injectable } from '@nestjs/common';
import { Session } from 'src/domain/session';
import { SessionRepository } from 'src/repositories/session.repository';

@Injectable()
export class InMemorySessionsRepo implements SessionRepository {
  private sessions: Session[] = [];

  private findIndex(id: string): number {
    return this.sessions.findIndex(
      (session: Session): boolean => session.sessionId === id,
    );
  }

  async create(session: Session): Promise<Session> {
    this.sessions.push(session);
    return session;
  }

  async findById(id: string): Promise<Session | null> {
    return (
      this.sessions.find(
        (session: Session): boolean => session.sessionId === id,
      ) ?? null
    );
  }

  async findAll(): Promise<Session[]> {
    return this.sessions;
  }

  async update(
    id: string,
    patch: Partial<Session>,
  ): Promise<Session | null> {
    const index = this.findIndex(id);
    if (index === -1) return null;

    const updated: Session = { ...this.sessions[index], ...patch };
    this.sessions[index] = updated;
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.findIndex(id);
    if (index === -1) return false;

    this.sessions.splice(index, 1);
    return true;
  }
}
