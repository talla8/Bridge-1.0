import { SchoolId, UserId } from './ids';
export enum RoleId {
  ADMIN = 'Admin',
  INSTITUTION = 'Institution',
  TEACHER = 'Teacher',
  PARENT = 'Parent',
}

export class User {
  userId: UserId;
  fullName: string;
  email: string;
  phoneNumber?: string;
  schoolId?: SchoolId; //comment: if the user is a super admin why would they need a school id? is it the best way?
  passwordHash: string;
  roleId: RoleId;
  isActive: boolean;
  isVerified: boolean;
}
