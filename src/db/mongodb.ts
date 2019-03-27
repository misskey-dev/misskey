import config from '../config';

const u = config.db.user ? encodeURIComponent(config.db.user) : null;
const p = config.db.pass ? encodeURIComponent(config.db.pass) : null;

const uri = `mongodb://${u && p ? `${u}:${p}@` : ''}${config.db.host}:${config.db.port}/${config.db.db}`;

/**
 * monk
 */
import mongo from 'monk';

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
		mongodb.MongoClient.connect(uri, { useNewUrlParser: true }, (e: Error, client: any) => {
			if (e) return reject(e);
			resolve(client.db(config.db.db));
		});
	}))();

	mdb = db;

	return db;
};

export { nativeDbConn };
