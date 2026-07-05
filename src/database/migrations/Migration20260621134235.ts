import { Migration } from '@mikro-orm/migrations';

export class Migration20260621134235 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "project" drop constraint if exists "project_status_check";`);

    this.addSql(`alter table "project" alter column "tags" drop default;`);
    this.addSql(`alter table "project" alter column "tags" type jsonb using ("tags"::jsonb);`);
    this.addSql(`alter table "project" add constraint "project_status_check" check("status" in ('active', 'ongoing', 'paused', 'completed', 'canceled', 'archived'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "project" drop constraint if exists "project_status_check";`);

    this.addSql(`alter table "project" alter column "tags" type jsonb using ("tags"::jsonb);`);
    this.addSql(`alter table "project" alter column "tags" set default '[]';`);
    this.addSql(`alter table "project" add constraint "project_status_check" check("status" in ('active', 'ongoing', 'paused', 'completed', 'canceled'));`);
  }

}
