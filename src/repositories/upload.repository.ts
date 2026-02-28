export interface UploadRepository {
  create(upload: any): Promise<any>; 
  findById(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, patch: Partial<any>): Promise<any | null>;
  delete(id: string): Promise<boolean>;
}
