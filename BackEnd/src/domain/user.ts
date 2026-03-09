import { UserId } from './ids';
export enum RoleId {
  Admin = '1',
  Teacher = 'Teacher',
  Parent = '3',
} //fix this

export class User {
  userId: UserId;
  fullName: string;
  email: string;
  passwordHash: string;
  roleId: RoleId;
  isActive: boolean;
}
