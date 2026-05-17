// entities/TimelineEvent.ts
import {Entity, Enum, ManyToOne, PrimaryKey, Property} from "@mikro-orm/core";
import {BaseEntity} from "./Base.entity";
import {Project} from "./Project.entity";

export enum TimelineEventType {
    PHOTO = 'photo',
    NOTE = 'note',
    MILESTONE = 'milestone',
    TEAM = 'team',
}

@Entity()
export class TimelineEvent extends BaseEntity{

    @Property()
    title: string;

    @Property({ type: 'text' })
    description: string;

    @Enum(() => TimelineEventType)
    type: TimelineEventType; //

    @Property({ nullable: true })
    photoUrl?: string; // Para eventos tipo "photo"

    @ManyToOne(() => Project)
    project!: Project;
}