import { Column, Entity, PrimaryColumn } from 'typeorm';
import { User, RoleId } from 'src/domain/user';

@Entity({ name: 'users' })
export class UserEntity implements User {
  @PrimaryColumn({ name: 'userId', type: 'text' })
  userId: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  @Column({ name: 'email', type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  phoneNumber?: string;

  @Column({ type: 'text', nullable: true })
  schoolId?: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @Column({ name: 'role_id', type: 'text' })
  roleId: RoleId;

  @Column({ name: 'is_active', type: 'boolean' })
  isActive: boolean;

  @Column({ name: 'is_verified', type: 'boolean' })
  isVerified: boolean;
}
