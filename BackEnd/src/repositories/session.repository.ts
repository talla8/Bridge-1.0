import { Session } from 'src/domain/session';

export interface SessionRepository {
  create(session: Session): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findAll(): Promise<Session[]>;
  update(id: string, patch: Partial<Session>): Promise<Session | null>;
  delete(id: string): Promise<boolean>;
}
