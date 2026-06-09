import {Entity, ManyToOne, Property} from "@mikro-orm/core";
import {Project} from "./Project.entity";
import User from "./User.entity";
import {BaseEntity} from "./Base.entity";

@Entity()
export class PhotoEntity extends BaseEntity {
  @Property({ length: 500 })
  url: string;

  @Property({ nullable: true })
  caption?: string;

  @Property({ type: 'json' })
  tags: string[] = [];

  @ManyToOne(() => Project)
  project!: Project;

  @ManyToOne(() => User)
  uploadedBy!: User;
}