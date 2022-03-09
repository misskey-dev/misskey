import config from './built/config/index.js';
import { entities } from './built/db/postgre.js';

export default {
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.user,
	password: config.db.pass,
	database: config.db.db,
	extra: config.db.extra,
	entities: entities,
	migrations: ['migration/*.js'],
	cli: {
		migrationsDir: 'migration'
	}
};
