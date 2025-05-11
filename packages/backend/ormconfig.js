import { DataSource } from 'typeorm';
import { loadConfig } from './built/config.js';
import { entities } from './built/postgres.js';
import { isConcurrentIndexMigrationEnabled } from "./migration/js/migration-config.js";

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
	migrationsTransactionMode: isConcurrentIndexMigrationEnabled() ? 'each' : 'all',
});
