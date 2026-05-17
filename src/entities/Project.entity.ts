import {Collection, Entity, Enum, ManyToMany, OneToMany, Property} from "@mikro-orm/core";
import {BaseEntity} from "./Base.entity";
import User, { UserRole } from './User.entity';
import {PhotoEntity} from "./Photo.entity";
import {TimelineEvent} from "./TimelineEvent.entity";
import {Note} from "./Note.entity";

export enum ProjectStatus {
  ONGOING = 'ongoing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

@Entity()
export class Project extends BaseEntity {
  @Property()
  name: string;

  @Property({ type: 'text' })
  location: string;

  @Property({ type: 'double', nullable: true })
  latitude?: number;

  @Property({ type: 'double', nullable: true })
  longitude?: number;

  @Property({ nullable: true })
  thumbnail?: string;

  @Property({ type: 'text' })
  description: string;

  @Enum({ items: () => UserRole })
  status: ProjectStatus = ProjectStatus.ONGOING;

  @Property({ default: 0 })
  progress: number;

  @Property()
  startDate: Date;

  @Property({ nullable: true })
  endDate?: Date;

  @ManyToMany(() => User, 'projects', { owner: true })
  members = new Collection<User>(this);

  @OneToMany(() => PhotoEntity, photo => photo.project)
  photos = new Collection<PhotoEntity>(this);

  @OneToMany(() => Note, note => note.project)
  notes = new Collection<Note>(this);

  @OneToMany(() => TimelineEvent, event => event.project)
  timeline = new Collection<TimelineEvent>(this);
}