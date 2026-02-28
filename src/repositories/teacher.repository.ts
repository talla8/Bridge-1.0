export interface TeacherRepository {
  create(teacher: any): Promise<any>;
  findById(id: string): Promise<any>;
  findByEmail(email: string): Promise<any>;
  existsByEmail(email: string): Promise <any|null>;
  findAll(): Promise<any[]>;
  update(id: string, patch: Partial<any>): Promise<any | null>;
  delete(id: string): Promise<boolean>;

}
