export interface ParentRepository {
  create(parent: any): Promise<any>; 
  findById(id: string): Promise<any | null>;
  findByEmail(email: string): Promise<any>;
  existsByEmail(email: string): Promise <any|null>;
  findAll(): Promise<any[]>;
  update(id: string, patch: Partial<any>): Promise<any | null>;
  delete(id: string): Promise<boolean>;

  
}

//should i add sth to find the relation? or children ? 