import { DataSource } from 'typeorm';
import { loadConfig } from './src-js/config.js';
import { entities } from './src-js/postgres.js';

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

const config = loadConfig();

export default new DataSource({
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.user,
	password: config.db.pass,
	database: config.db.db,
	extra: config.db.extra,
	entities: entities,
	migrations: ['migration/*.js'],
	migrationsTransactionMode: isConcurrentIndexMigrationEnabled ? 'each' : 'all',
});
