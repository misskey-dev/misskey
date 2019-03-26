import { createConnection, Logger } from 'typeorm';
import config from '../config';
import { dbLogger } from './logger';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false);

class MyCustomLogger implements Logger {
	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(query);
	}

	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(query);
	}

	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(query);
	}

	public logSchemaBuild(message: string) {
		sqlLogger.info(message);
	}

	public log(message: string) {
		sqlLogger.info(message);
	}

	public logMigration(message: string) {
		sqlLogger.info(message);
	}
}

export function createPostgreConnection(entities: any[], name = 'default') {
	return createConnection({
		name,
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		logging: !['production', 'test'].includes(process.env.NODE_ENV),
		logger: new MyCustomLogger(),
		entities: entities
	});
}
