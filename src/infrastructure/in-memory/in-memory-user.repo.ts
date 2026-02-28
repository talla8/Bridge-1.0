import { UserRepository } from 'src/repositories/user.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class InMemoryUsersRepo implements UserRepository {
  private users: any[] = [];

  async create(user: any): Promise<any> {
    const normalized = {
      userId: user.userId ?? user.UserId,
      fullName: user.fullName ?? user.FullName,
      email: user.email ?? user.Email,
      passwordHash: user.passwordHash ?? user.PasswordHash,
      role: user.role ?? user.RoleId,
      isActive: user.isActive ?? user.IsActive ?? true,
    };
    this.users.push(normalized);
    return normalized;
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.users.find(function (user: any): boolean {
      return user.email === email;
    });
  }

  async existsByEmail(email: string): Promise<any | null> {
    const result = this.users.find(function (user: any): boolean {
      return user.email === email;
    });
    return !!result;
  }

  async findAll(filters?: {
    role?: string;
    isActive?: boolean | string;
    search?: string;
  }): Promise<any[]> {
    if (!filters) return this.users;

    const role = filters.role?.toLowerCase();
    const search = filters.search?.toLowerCase();
    const isActive =
      typeof filters.isActive === 'string'
        ? filters.isActive.toLowerCase() === 'true'
        : filters.isActive;

    return this.users.filter((user: any): boolean => {
      const roleOk = role
        ? String(user.role ?? '').toLowerCase() === role
        : true;
      const activeOk =
        isActive !== undefined
          ? String(user.isActive ?? '').toLowerCase() === String(isActive)
          : true;
      const searchOk = search
        ? String(user.fullName ?? '').toLowerCase().includes(search) ||
          String(user.email ?? '').toLowerCase().includes(search)
        : true;

      return roleOk && activeOk && searchOk;
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.users.find(function (user: any): boolean {
      return user.userId === id;
    });
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex((user: any): boolean => user.userId === id);
    if (index === -1) return false;

    this.users[index] = {
      ...this.users[index],
      isActive: false,
    };
    return true;
  }

  async update(
    id: string,
    patch: Partial<Omit<any, 'id' | 'createdAt'>>,
  ): Promise<any | null> {
    //1 fins the right user :

    let index: number = this.users.findIndex(function (user: any): any {
      if (user.userId === id) return user;  
    });
    if (index === -1) return null;
    const current: any  = this.users[index];

    //2: merge :
    let updated: any={...current,...patch};
    this.users[index] = updated; 
    
    return updated;
  }

  async exists(id: string) : Promise<any | null> {

    let target: number = this.users.find(function (user: any): any {
      if (user.userId === id) return user.userId;  
    });

    if(target) return true;
    else return false;

  }

  
}
