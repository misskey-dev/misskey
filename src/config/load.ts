/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import $ from 'cafy';
import * as yaml from 'js-yaml';
import * as pkg from '../../package.json';
import { fromNullable } from '../prelude/maybe';

/**
 * Path of configuration directory
 */
const dir = `${__dirname}/../../.config`;

/**
 * Path of configuration file
 */
const path = process.env.NODE_ENV == 'test'
	? `${dir}/test.yml`
	: `${dir}/default.yml`;

export default function load() {
	const config = yaml.safeLoad(fs.readFileSync(path, 'utf-8'));

	if (typeof config.url !== 'string') {
		throw 'You need to configure the URL.';
	}

	const url = validateUrl(config.url);

	if (typeof config.port !== 'number') {
		throw 'You need to configure the port.';
	}

	if (config.https != null) {
		if (typeof config.https.key !== 'string') {
			throw 'You need to configure the https key.';
		}
		if (typeof config.https.cert !== 'string') {
			throw 'You need to configure the https cert.';
		}
	}

	if (config.mongodb == null) {
		throw 'You need to configure the MongoDB.';
	}

	if (typeof config.mongodb.host !== 'string') {
		throw 'You need to configure the MongoDB host.';
	}

	if (typeof config.mongodb.port !== 'number') {
		throw 'You need to configure the MongoDB port.';
	}

	if (typeof config.mongodb.db !== 'string') {
		throw 'You need to configure the MongoDB database name.';
	}

	if (config.drive == null) {
		throw 'You need to configure the drive.';
	}

	if (typeof config.drive.storage !== 'string') {
		throw 'You need to configure the drive storage type.';
	}

	if (!$.str.or(['db', 'minio']).ok(config.drive.storage)) {
		throw 'Unrecognized drive storage type is specified.';
	}

	if (config.drive.storage === 'minio') {
		if (typeof config.drive.bucket !== 'string') {
			throw 'You need to configure the minio bucket.';
		}

		if (typeof config.drive.prefix !== 'string') {
			throw 'You need to configure the minio prefix.';
		}

		if (config.drive.prefix.config == null) {
			throw 'You need to configure the minio.';
		}
	}

	if (config.redis != null) {
		if (typeof config.redis.host !== 'string') {
			throw 'You need to configure the Redis host.';
		}

		if (typeof config.redis.port !== 'number') {
			throw 'You need to configure the Redis port.';
		}
	}

	if (config.elasticsearch != null) {
		if (typeof config.elasticsearch.host !== 'string') {
			throw 'You need to configure the Elasticsearch host.';
		}

		if (typeof config.elasticsearch.port !== 'number') {
			throw 'You need to configure the Elasticsearch port.';
		}
	}

	const source = {
		url: normalizeUrl(config.url as string),
		port: config.port as number,
		https: fromNullable(config.https).map(x => ({
			key: x.key as string,
			cert: x.cert as string,
			ca: fromNullable<string>(x.ca)
		})),
		mongodb: {
			host: config.mongodb.host as string,
			port: config.mongodb.port as number,
			db: config.mongodb.db as string,
			user: fromNullable<string>(config.mongodb.user),
			pass: fromNullable<string>(config.mongodb.pass)
		},
		redis: fromNullable(config.redis).map(x => ({
			host: x.host as string,
			port: x.port as number,
			pass: fromNullable<string>(x.pass)
		})),
		elasticsearch: fromNullable(config.elasticsearch).map(x => ({
			host: x.host as string,
			port: x.port as number,
			pass: fromNullable<string>(x.pass)
		})),
		disableHsts: typeof config.disableHsts === 'boolean' ? config.disableHsts as boolean : false,
		drive: {
			storage: config.drive.storage as string,
			bucket: config.drive.bucket as string,
			prefix: config.drive.prefix as string,
			baseUrl: fromNullable<string>(config.drive.baseUrl),
			config: config.drive.config
		},
		autoAdmin: typeof config.autoAdmin === 'boolean' ? config.autoAdmin as boolean : false,
		proxy: fromNullable<string>(config.proxy),
		clusterLimit: typeof config.clusterLimit === 'number' ? config.clusterLimit as number : Infinity,
	};

	const host = url.host;
	const scheme = url.protocol.replace(/:$/, '');
	const ws_scheme = scheme.replace('http', 'ws');

	const mixin = {
		host: url.host,
		hostname: url.hostname,
		scheme: scheme,
		ws_scheme: ws_scheme,
		ws_url: `${ws_scheme}://${host}`,
		api_url: `${scheme}://${host}/api`,
		auth_url: `${scheme}://${host}/auth`,
		dev_url: `${scheme}://${host}/dev`,
		docs_url: `${scheme}://${host}/docs`,
		stats_url: `${scheme}://${host}/stats`,
		status_url: `${scheme}://${host}/status`,
		drive_url: `${scheme}://${host}/files`,
		user_agent: `Misskey/${pkg.version} (${config.url})`
	};

	return Object.assign(source, mixin);
}

function tryCreateUrl(url: string) {
	try {
		return new URL(url);
	} catch (e) {
		throw `url="${url}" is not a valid URL.`;
	}
}

function validateUrl(url: string) {
	const result = tryCreateUrl(url);
	if (result.pathname.replace('/', '').length) throw `url="${url}" is not a valid URL, has a pathname.`;
	if (!url.includes(result.host)) throw `url="${url}" is not a valid URL, has an invalid hostname.`;
	return result;
}

function normalizeUrl(url: string) {
	return url.endsWith('/') ? url.substr(0, url.length - 1) : url;
}
