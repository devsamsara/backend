import { Migration } from '@mikro-orm/migrations';

export class Migration20260705004946 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "push_token" add column "platform" varchar(255) not null;`);
    this.addSql(`alter table "push_token" alter column "enabled" type boolean using ("enabled"::boolean);`);
    this.addSql(`alter table "push_token" alter column "enabled" set default true;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "refresh_token" ("id" uuid not null, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "user_id" uuid not null, "token" text not null, "expires_at" timestamptz(6) not null, constraint "refresh_token_pkey" primary key ("id"));`);
    this.addSql(`create index "refresh_token_created_at_index" on "refresh_token" ("created_at");`);

    this.addSql(`alter table "refresh_token" add constraint "refresh_token_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "push_token" drop column "platform";`);

    this.addSql(`alter table "push_token" alter column "enabled" type bool using ("enabled"::bool);`);
    this.addSql(`alter table "push_token" alter column "enabled" set default false;`);
  }

}
