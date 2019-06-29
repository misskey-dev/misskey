import * as fs from 'fs';
import config from './config';
import { entities as charts } from './services/chart/entities';

const json = {
	type: 'postgres',
	host: config.db.host,
	port: config.db.port,
	username: config.db.user,
	password: config.db.pass,
	database: config.db.db,
	extra: config.db.extra,
	entities: [
		'src/models/entities/*.ts',
		...charts as any
	],
	migrations: ['migration/*.ts'],
	cli: {
		migrationsDir: 'migration'
	}
};

fs.writeFileSync('ormconfig.json', JSON.stringify(json));
