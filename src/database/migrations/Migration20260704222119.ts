import { Migration } from '@mikro-orm/migrations';

export class Migration20260704222119 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "refresh_token_entity" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "user_id" uuid not null, "token" text not null, "expires_at" timestamptz not null, constraint "refresh_token_entity_pkey" primary key ("id"));`);
    this.addSql(`create index "refresh_token_entity_created_at_index" on "refresh_token_entity" ("created_at");`);

    this.addSql(`create table "push_token" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "token" varchar(255) not null, "user_id" uuid not null, constraint "push_token_pkey" primary key ("id"));`);
    this.addSql(`create index "push_token_created_at_index" on "push_token" ("created_at");`);

    this.addSql(`alter table "refresh_token_entity" add constraint "refresh_token_entity_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table "push_token" add constraint "push_token_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table "refresh_token" ("id" uuid not null, "created_at" timestamptz(6) not null, "updated_at" timestamptz(6) not null, "user_id" uuid not null, "token" text not null, "expires_at" timestamptz(6) not null, constraint "refresh_token_pkey" primary key ("id"));`);
    this.addSql(`create index "refresh_token_created_at_index" on "refresh_token" ("created_at");`);

    this.addSql(`alter table "refresh_token" add constraint "refresh_token_user_id_foreign" foreign key ("user_id") references "users" ("id") on update cascade on delete cascade;`);
  }

}
