import { createPostgreConnection } from '../postgre';
import { entities } from '../../services/chart/entities';
import { dbLogger } from '../logger';
import { Logger } from 'typeorm';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false).createSubLogger('chart', 'white');

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

export function initChartPostgre() {
	return createPostgreConnection(entities, 'charts', new MyCustomLogger());
}
