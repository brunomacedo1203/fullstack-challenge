import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddCommentsAndHistory1700000000001 implements MigrationInterface {
  name = 'AddCommentsAndHistory1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'task_id', type: 'uuid', isNullable: false },
          { name: 'author_id', type: 'uuid', isNullable: true },
          { name: 'content', type: 'text', isNullable: false },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [
          {
            name: 'IDX_comments_task_created_at',
            columnNames: ['task_id', 'created_at'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(
      `CREATE TYPE "task_history_event_type" AS ENUM ('TASK_CREATED','TASK_UPDATED','COMMENT_CREATED')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'task_history',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'task_id', type: 'uuid', isNullable: false },
          { name: 'actor_id', type: 'uuid', isNullable: true },
          { name: 'type', type: 'task_history_event_type', isNullable: false },
          { name: 'payload', type: 'jsonb', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        indices: [
          {
            name: 'IDX_task_history_task_created_at',
            columnNames: ['task_id', 'created_at'],
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'task_history',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const commentsTable = await queryRunner.getTable('comments');
    if (commentsTable) {
      const fk = commentsTable.foreignKeys.find((foreignKey) =>
        foreignKey.columnNames.includes('task_id'),
      );
      if (fk) {
        await queryRunner.dropForeignKey('comments', fk);
      }
    }
    await queryRunner.dropTable('comments');

    const historyTable = await queryRunner.getTable('task_history');
    if (historyTable) {
      const fk = historyTable.foreignKeys.find((foreignKey) =>
        foreignKey.columnNames.includes('task_id'),
      );
      if (fk) {
        await queryRunner.dropForeignKey('task_history', fk);
      }
    }
    await queryRunner.dropTable('task_history');

    await queryRunner.query('DROP TYPE IF EXISTS "task_history_event_type"');
  }
}
