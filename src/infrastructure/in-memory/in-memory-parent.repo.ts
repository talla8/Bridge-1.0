import { ParentRepository } from 'src/repositories/parent.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryParentsRepo implements ParentRepository {
  private parents: any[] = [];

  async create(parent: any): Promise<any> {
    this.parents.push(parent);
    return parent;
  }

  async findById(id: string): Promise<any | null> {
    return this.parents.find(function (parent: any): boolean {
      return parent.id === id;
    });
  }

  async findAll(): Promise<any[]> {
    return this.parents;
  }

  async update(id: string, patch: Partial<any>): Promise<any | null> {
    const index = this.parents.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return null;

    const current = this.parents[index];
    const updated = { ...current, ...patch };
    this.parents[index] = updated;
    return updated;
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.parents.find(function (parent: any): boolean {
      return parent.email === email;
    });
  }

  async existsByEmail(email: string): Promise <any|null>{
        const result: any = this.parents.find(function (user: any): boolean {
      return user.email === email;
    });
    if (result)
      return true; 
    return false;
  } //need rewriting : logic is working right 

  async delete(id: string): Promise<boolean> {
    const index = this.parents.findIndex((item: any): boolean => item.id === id);
    if (index === -1) return false;

    this.parents.splice(index, 1);
    return true;
  }
}
