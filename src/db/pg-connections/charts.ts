import { createPostgreConnection } from '../postgre';
import { entities } from '../../services/chart/entities';
import { dbLogger } from '../logger';
import { Logger } from 'typeorm';
import * as highlight from 'cli-highlight';

const sqlLogger = dbLogger.createSubLogger('sql', 'white', false).createSubLogger('chart', 'white');

class MyCustomLogger implements Logger {
	private highlight(sql: string) {
		return highlight.highlight(sql, {
			language: 'sql', ignoreIllegals: true,
		});
	}

	public logQuery(query: string, parameters?: any[]) {
		sqlLogger.info(this.highlight(query));
	}

	public logQueryError(error: string, query: string, parameters?: any[]) {
		sqlLogger.error(this.highlight(query));
	}

	public logQuerySlow(time: number, query: string, parameters?: any[]) {
		sqlLogger.warn(this.highlight(query));
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
