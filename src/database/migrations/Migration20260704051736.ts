import { Migration } from '@mikro-orm/migrations';

export class Migration20260704051736 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "timeline_event" drop constraint "timeline_event_project_id_foreign";`);

    this.addSql(`alter table "photo_entity" drop constraint "photo_entity_project_id_foreign";`);

    this.addSql(`alter table "note" drop constraint "note_project_id_foreign";`);

    this.addSql(`alter table "timeline_event" add constraint "timeline_event_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "photo_entity" add constraint "photo_entity_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "note" add constraint "note_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "note" drop constraint "note_project_id_foreign";`);

    this.addSql(`alter table "photo_entity" drop constraint "photo_entity_project_id_foreign";`);

    this.addSql(`alter table "timeline_event" drop constraint "timeline_event_project_id_foreign";`);

    this.addSql(`alter table "note" add constraint "note_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete no action;`);

    this.addSql(`alter table "photo_entity" add constraint "photo_entity_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete no action;`);

    this.addSql(`alter table "timeline_event" add constraint "timeline_event_project_id_foreign" foreign key ("project_id") references "project" ("id") on update cascade on delete no action;`);
  }

}
