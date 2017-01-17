const mongo = require('mongoskin');

import config from '../conf';

const uri = config.mongodb.user && config.mongodb.pass
	? `mongodb://${config.mongodb.user}:${config.mongodb.pass}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`
	: `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.db}`;

const db = mongo.db(uri, { native_parser: true });

export default db;
