import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './Base.entity';
import User from './User.entity';

@Entity()
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({ type: 'text' })
  token!: string;

  @Property()
  expiresAt!: Date;

  constructor(user: User, token: string, expiresAt: Date) {
    super();
    this.user = user;
    this.token = token;
    this.expiresAt = expiresAt;
  }
}
