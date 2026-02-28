import { UserId } from './ids';
export enum RoleId {
  Admin = '1',
  Teacher = '2',
  Parent = '3',
} //fix this

export class User {
  userId: UserId;
  fulllName: string;
  email: string;
  passwordHash: string;
  roleId: RoleId;
  isActive: boolean;
}
