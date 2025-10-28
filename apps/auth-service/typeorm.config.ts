import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// Inverte a ordem: arquivos mais genéricos primeiro, mais específicos depois
// Assim, os arquivos específicos sobrescrevem os genéricos
const envFiles = ['.env', '.env.local', `.env.${process.env.NODE_ENV ?? 'development'}`];

// Usa process.cwd() que sempre aponta para a raiz do projeto
// independentemente de onde o código compilado está executando
const projectRoot = process.cwd();

for (const file of envFiles) {
  const filePath = join(projectRoot, file);
  if (existsSync(filePath)) {
    config({ path: filePath, override: true });
  }
}

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER ?? 'postgres',
  password: process.env.DATABASE_PASSWORD ?? 'password',
  database: process.env.DATABASE_NAME ?? 'challenge_db',
  entities: [join(__dirname, 'src/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, 'src/migrations/*.{ts,js}')],
  synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
