import { createConnection } from 'typeorm';
import config from '../config';

export function initPostgre() {
	return createConnection({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		logging: true
	});
}
