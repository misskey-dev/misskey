import { nativeDbConn } from '../db/mongodb';
import { Config } from '../config/types';
import Logger from '../services/logger';
import { lessThan } from '../prelude/array';

const requiredMongoDBVersion = [3, 6];

export function checkMongoDB(config: Config, logger: Logger) {
	return new Promise((res, rej) => {
		const mongoDBLogger = logger.createSubLogger('db');
		if (config.db.type !== 'mongodb')
			rej(`DB type '${config.db.type}' is not supported in this version.`);
		const u = config.db.user ? encodeURIComponent(config.db.user) : null;
		const p = config.db.pass ? encodeURIComponent(config.db.pass) : null;
		const uri = `mongodb://${u && p ? `${u}:****@` : ''}${config.db.host}:${config.db.port}/${config.db.db}`;
		mongoDBLogger.info(`Connecting to ${uri} ...`);

		nativeDbConn().then(db => {
			mongoDBLogger.succ('Connectivity confirmed');

			db.admin().serverInfo().then(x => {
				const version = x.version as string;
				mongoDBLogger.info(`Version: ${version}`);
				if (lessThan(version.split('.').map(x => parseInt(x, 10)), requiredMongoDBVersion)) {
					mongoDBLogger.error(`MongoDB version is less than ${requiredMongoDBVersion.join('.')}. Please upgrade it.`);
					rej('outdated version');
				} else {
					res();
				}
			}).catch(err => {
				mongoDBLogger.error(`Failed to fetch server info: ${err.message}`);
				rej(err);
			});
		}).catch(err => {
			mongoDBLogger.error(err.message);
			rej(err);
		});
	});
}
