import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexTasksCreatedAt1730665000002 implements MigrationInterface {
  name = 'AddIndexTasksCreatedAt1730665000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_tasks_created_at" ON "tasks" ("created_at" DESC)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_tasks_created_at"');
  }
}
