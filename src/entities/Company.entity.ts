import {
  BeforeCreate,
  Cascade,
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import {BaseEntity} from './Base.entity';
import User, {UserStatus} from './User.entity';
import bcrypt from "bcryptjs";

export enum CompanyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity()
export class Company extends BaseEntity {
  @Property()
  name: string;

  @ManyToOne({
    entity: () => User,
    inversedBy: 'companies',
    nullable: true,
    cascade: [Cascade.REMOVE],
  })
  owner?: User;

  @Property()
  industry: string;

  @Property()
  size: number;

  @Enum({ items: () => CompanyStatus })
  status: CompanyStatus = CompanyStatus.INACTIVE;

  @OneToMany(() => User, user => user.company)
  users = new Collection<User>(this);
}
