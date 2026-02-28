export interface StudentRepository {
  create(student: any): Promise<any>; 
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  findByParentId(parentId: string): Promise <any | null>;
  findByGradeId(gradeId: string): Promise <any | null>;
  update(id: string, patch: Partial<any>): Promise<any | null>;
  delete(id: string): Promise<boolean>;
}