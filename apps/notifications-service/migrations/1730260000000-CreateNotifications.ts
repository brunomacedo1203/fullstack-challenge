import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1730260000000 implements MigrationInterface {
  name = 'CreateNotifications1730260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_id" uuid NOT NULL,
        "type" character varying(64) NOT NULL,
        "task_id" uuid NOT NULL,
        "comment_id" uuid,
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "read_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_read" ON "notifications" ("recipient_id", "read_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_recipient_created" ON "notifications" ("recipient_id", "created_at")`,
    );

    await queryRunner.query(`CREATE TABLE "task_participants" (
        "task_id" uuid NOT NULL,
        "creator_id" uuid,
        "assignee_ids" uuid[] NOT NULL DEFAULT '{}'::uuid[],
        CONSTRAINT "PK_task_participants_task_id" PRIMARY KEY ("task_id")
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "task_participants"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_recipient_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_recipient_read"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
