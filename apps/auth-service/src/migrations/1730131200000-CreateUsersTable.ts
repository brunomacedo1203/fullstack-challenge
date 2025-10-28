import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1730131200000 implements MigrationInterface {
  name = 'CreateUsersTable1730131200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "username" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "refresh_token_hash" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_username" UNIQUE ("username")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "users";');
  }
}
