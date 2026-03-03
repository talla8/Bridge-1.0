import { RoleId } from "src/domain/user";

export class SignUpDTO {
  userName: string;
  email: string;
  role: RoleId;
  phoneNumber?: string;
  passwordHash: string;
}
