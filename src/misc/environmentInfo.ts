import Logger from './logger';

export default class {
	public static show(): void {
		const env = process.env.NODE_ENV;
		const logger = new Logger('Env');
		logger.info(typeof env == 'undefined' ? 'NODE_ENV is not set' : `NODE_ENV: ${env}`);

		if (env !== 'production') {
			logger.warn('The environment is not in production mode');
			logger.warn('Do not use for production purpose');
		}
	}
}
