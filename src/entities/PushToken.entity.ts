import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './Base.entity';
import User from './User.entity';


@Entity()
export class PushToken extends BaseEntity {
  @Property()
  token!: string;

  @ManyToOne(() => User, { deleteRule: 'cascade' })
  user!: User;

  @Property({default: true})
  enabled: boolean;

  @Property()
  platform: string;
}
