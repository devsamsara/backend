import { Migration } from '@mikro-orm/migrations';

export class Migration20260609053747 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "photo_entity" alter column "url" type varchar(500) using ("url"::varchar(500));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "photo_entity" alter column "url" type varchar(255) using ("url"::varchar(255));`);
  }

}
