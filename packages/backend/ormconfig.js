import { DataSource } from 'typeorm';
import config from './built/config/index.js';
import { entities } from './built/db/postgre.js';

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
});
