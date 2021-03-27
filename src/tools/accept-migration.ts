// ex) node built/tools/accept-migration Yo 1000000000001

import { createConnection } from 'typeorm';
import config from '@/config';

createConnection({
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.user,
	password: config.db.pass,
	database: config.db.db,
	extra: config.db.extra,
	synchronize: false,
	dropSchema: false,
}).then(c => {
	c.query(`INSERT INTO migrations(timestamp,name) VALUES (${process.argv[3]}, '${process.argv[2]}${process.argv[3]}');`).then(() => {
		console.log('done');
		process.exit(0);
	}).catch(e => {
		console.log('ERROR:');
		console.log(e);
		process.exit(1);
	});
});
