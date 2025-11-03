import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUuidDefaultsToTasksCommentsHistory1730665000001 implements MigrationInterface {
  name = 'AddUuidDefaultsToTasksCommentsHistory1730665000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query('ALTER TABLE "tasks" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()');
    await queryRunner.query(
      'ALTER TABLE "comments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()',
    );
    await queryRunner.query(
      'ALTER TABLE "task_history" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "task_history" ALTER COLUMN "id" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "comments" ALTER COLUMN "id" DROP DEFAULT');
    await queryRunner.query('ALTER TABLE "tasks" ALTER COLUMN "id" DROP DEFAULT');
  }
}
