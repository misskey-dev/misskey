import { createConnection, Logger, getConnection } from 'typeorm';
import config from '../config';

export function createPostgreConnection(entities: any[], name: string, logger: Logger) {
	try {
		return getConnection(name);
	} catch (e) {}

	return createConnection({
		name,
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		//dropSchema: process.env.NODE_ENV === 'test',
		logging: !['production', 'test'].includes(process.env.NODE_ENV),
		logger: logger,
		entities: entities
	});
}
