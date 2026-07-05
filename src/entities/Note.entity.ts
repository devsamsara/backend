import { Entity, ManyToOne, Property } from '@mikro-orm/core';
import { BaseEntity } from './Base.entity';
import User from './User.entity';
import { Project } from './Project.entity';

@Entity()
export class Note extends BaseEntity {
  @Property({ type: 'text' })
  content: string;

  @Property({ default: false })
  pinned: boolean = false;

  @ManyToOne(() => User)
  author!: User; // Relación con el usuario que la creó

  @ManyToOne(() => Project, { inversedBy: 'notes', deleteRule: 'cascade' })
  project!: Project; // La nota pertenece a un proyecto
}
