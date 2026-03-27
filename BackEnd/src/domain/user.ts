import { UserId } from './ids';
export enum RoleId {
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  PARENT = 'Parent',
}

export class User {
  userId: UserId;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: RoleId;
  isActive: boolean;
  isVerified: boolean;
}
