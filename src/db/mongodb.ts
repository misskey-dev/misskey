import config from '../conf';

const uri = config.mongodb.user && config.mongodb.pass
	? `mongodb://${config.mongodb.user}:${config.mongodb.pass}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`
	: `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;

/**
 * monk
 */
import * as mongo from 'monk';

const db = mongo(uri);

export default db;

/**
 * MongoDB native module (officialy)
 */
import * as mongodb from 'mongodb';

let mdb: mongodb.Db;

const nativeDbConn = async (): Promise<mongodb.Db> => {
	if (mdb) return mdb;

	const db = await ((): Promise<mongodb.Db> => new Promise((resolve, reject) => {
		mongodb.MongoClient.connect(uri, (e, db) => {
			if (e) return reject(e);
			resolve(db);
		});
	}))();

	mdb = db;

	return db;
};

export { nativeDbConn };
