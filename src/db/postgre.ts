import { createConnection, Logger } from 'typeorm';
import config from '../config';
import { dbLogger } from './logger';

class MyCustomLogger implements Logger {
	public logQuery(query: string, parameters?: any[]) {
		dbLogger.info(query);
	}

	public logQueryError(error: string, query: string, parameters?: any[]) {
		dbLogger.error(query);
	}

	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		dbLogger.warn(query);
	}

	public logSchemaBuild(message: string) {
		dbLogger.info(message);
	}

	public log(message: string) {
		dbLogger.info(message);
	}

	public logMigration(message: string) {
		dbLogger.info(message);
	}
}

export function initPostgre() {
	return createConnection({
		type: 'postgres',
		host: config.db.host,
		port: config.db.port,
		username: config.db.user,
		password: config.db.pass,
		database: config.db.db,
		synchronize: true,
		logging: true,
		logger: new MyCustomLogger()
	});
}
