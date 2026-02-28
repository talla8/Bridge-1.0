export interface AssesmentResultRepository {
  create(assesResult: any): Promise<any>;
  createMany(assesResults: any[]): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  findByUploadId(id: string): Promise<any | null>;
  findAll(): Promise<any[]>;
  update(id: string, patch: Partial<any>): Promise<any | null>;
  delete(id: string): Promise<boolean>;
  //must decide on a findbystudent id for the parents view(i dont think so but just think about it )
}
