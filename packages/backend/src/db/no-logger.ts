import { Logger } from 'typeorm';

export class NoLogger implements Logger {
	private highlight(sql: string) {
		return sql;
	}

	public logQuery(query: string, parameters?: unknown[]) {
		// sqlLogger.info(this.highlight(query).substring(0, 100));
	}

	public logQueryError(error: string, query: string, parameters?: unknown[]) {
		// sqlLogger.error(this.highlight(query));
	}

	public logQuerySlow(time: number, query: string, parameters?: unknown[]) {
		// sqlLogger.warn(this.highlight(query));
	}

	public logSchemaBuild(message: string) {
		// sqlLogger.info(message);
	}

	public log(message: string) {
		// sqlLogger.info(message);
	}

	public logMigration(message: string) {
		// sqlLogger.info(message);
	}
}
