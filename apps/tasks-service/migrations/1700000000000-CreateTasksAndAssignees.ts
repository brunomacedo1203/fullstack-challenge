import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTasksAndAssignees1700000000000 implements MigrationInterface {
  name = 'CreateTasksAndAssignees1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(
      `CREATE TYPE "task_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH','URGENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "task_status_enum" AS ENUM ('TODO','IN_PROGRESS','REVIEW','DONE')`,
    );

    // tasks table
    await queryRunner.createTable(
      new Table({
        name: 'tasks',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'title', type: 'varchar', length: '255', isNullable: false },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'due_date', type: 'timestamp', isNullable: true },
          { name: 'priority', type: 'task_priority_enum', isNullable: false, default: `'MEDIUM'` },
          { name: 'status', type: 'task_status_enum', isNullable: false, default: `'TODO'` },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    // task_assignees table
    await queryRunner.createTable(
      new Table({
        name: 'task_assignees',
        columns: [
          { name: 'task_id', type: 'uuid', isPrimary: true },
          { name: 'user_id', type: 'uuid', isPrimary: true },
          { name: 'assigned_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
        uniques: [{ name: 'UQ_task_user', columnNames: ['task_id', 'user_id'] }],
      }),
    );

    await queryRunner.createForeignKey(
      'task_assignees',
      new TableForeignKey({
        columnNames: ['task_id'],
        referencedTableName: 'tasks',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('task_assignees');
    if (table) {
      const fk = table.foreignKeys.find((f) => f.columnNames.includes('task_id'));
      if (fk) await queryRunner.dropForeignKey('task_assignees', fk);
    }
    await queryRunner.dropTable('task_assignees');
    await queryRunner.dropTable('tasks');
    await queryRunner.query('DROP TYPE IF EXISTS "task_priority_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "task_status_enum"');
  }
}
