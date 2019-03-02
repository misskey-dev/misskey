import { nativeDbConn } from '../db/mongodb';
import { Config } from '../config/types';
import Logger from '../services/logger';
import { lessThan } from '../prelude/array';

const requiredMongoDBVersion = [3, 6];

export function checkMongoDB(config: Config, logger: Logger) {
	return new Promise((res, rej) => {
		const mongoDBLogger = logger.createSubLogger('db');
		const u = config.mongodb.user ? encodeURIComponent(config.mongodb.user) : null;
		const p = config.mongodb.pass ? encodeURIComponent(config.mongodb.pass) : null;
		const uri = `mongodb://${u && p ? `${u}:****@` : ''}${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;
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
