import { Migration } from '@mikro-orm/migrations';

export class Migration20260621121402 extends Migration {

  override async up(): Promise<void> {
    this.addSql(
      `alter table "project" add column "tags" jsonb not null default '[]';`
    );

  }

  override async down(): Promise<void> {
    this.addSql(`alter table "project" drop column "tags";`);
  }

}
