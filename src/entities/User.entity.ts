import {
  BeforeCreate,
  BeforeUpdate,
  Collection,
  Entity,
  Enum,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import bcrypt from 'bcryptjs';
import {BaseEntity} from "./Base.entity";
import {Company} from "./Company.entity";
import {Project} from "./Project.entity";
import { generateBaseNickname } from '../utils/nickname.util';
import { RefreshToken } from './RefreshToken';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    ROOT = 'root',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    BANNED = 'banned',
}

@Entity({ tableName: 'users' })
class User extends BaseEntity {
  @Property({ length: 100 })
  name!: string;

  @Property({ length: 50, unique: true })
  @Index()
  nickname!: string;

  @Property()
  lastName: string = '';

  @Property({ length: 255, unique: true })
  @Index()
  email!: string;

  @Property({ length: 255, nullable: true })
  avatarUrl: string;

  @Property({ nullable: true })
  phone: string;

  @Property({ length: 255, hidden: true })
  password!: string;

  @ManyToOne({ entity: () => Company, inversedBy: 'users', nullable: false, deleteRule: "set null" })
  company!: Company;

  @ManyToMany(() => Project, project => project.members)
  projects = new Collection<Project>(this);

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user, {
    lazy: true,
  })
  refreshTokens = new Collection<RefreshToken>(this);

  @OneToMany({ entity: () => Company, mappedBy: 'owner' })
  companies = new Collection<Company>(this);

  @Enum({ items: () => UserRole })
  role: UserRole = UserRole.USER;

  @Enum({ items: () => UserStatus })
  status: UserStatus = UserStatus.ACTIVE;

  @Property({ nullable: true })
  lastLoginAt?: Date;

  @BeforeCreate()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash if password was changed (not already hashed)
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  @BeforeCreate()
  generateNickname(): void {
    if (!this.nickname) {
      this.nickname = generateBaseNickname(this.name, this.lastName);
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

export default User
