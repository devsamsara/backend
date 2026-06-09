import { Migration } from '@mikro-orm/migrations';

export class Migration20260522115842 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "project" drop constraint if exists "project_status_check";`);

    this.addSql(`alter table "users" drop constraint if exists "users_role_check";`);

    this.addSql(`alter table "project" add constraint "project_status_check" check("status" in ('active', 'ongoing', 'paused', 'completed', 'canceled'));`);

    this.addSql(`alter table "users" add constraint "users_role_check" check("role" in ('admin', 'user', 'root', 'field_technician', 'worker', 'client', 'viewer'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "project" drop constraint if exists "project_status_check";`);

    this.addSql(`alter table "users" drop constraint if exists "users_role_check";`);

    this.addSql(`alter table "project" add constraint "project_status_check" check("status" in ('admin', 'user', 'root'));`);

    this.addSql(`alter table "users" add constraint "users_role_check" check("role" in ('admin', 'user', 'root'));`);
  }

}
