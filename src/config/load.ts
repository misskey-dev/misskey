/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import * as yaml from 'js-yaml';
import { Source, Mixin } from './types';
import * as pkg from '../../package.json';

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
	if (process.env.MONGODB_URI) var mongodburi = new URL(process.env.MONGODB_URI);
	if (process.env.REDIS_URL) var redisurl = new URL(process.env.REDIS_URL);
	const config: Source = process.env.HEROKU === 'true' ? {
		mongodb: {
			host: mongodburi.hostname,
			port: parseInt(mongodburi.port),
			db: mongodburi.pathname.slice(1),
			user: mongodburi.username,
			pass: mongodburi.password,
		},	
		redis: {
			host: redisurl.hostname,
			port: parseInt(redisurl.port),
			pass: redisurl.password,
		},
		drive: {
			storage: 'db',
		}
	} : yaml.safeLoad(fs.readFileSync(path, 'utf-8'));

	const mixin = {} as Mixin;

	config.url = config.url || process.env.LOCAL_DOMAIN;

	const url = validateUrl(config.url);

	config.url = normalizeUrl(config.url);

	config.port = config.port || parseInt(process.env.PORT, 10);

	config.disableHsts = config.disableHsts || process.env.DISABLE_HSTS === "true" ? true : false;

	config.clusterLimit = config.clusterLimit || parseInt(process.env.CLUSTER_LIMIT);

	config.autoAdmin = config.autoAdmin || process.env.AUTO_ADMIN === "true" ? true : false;

	mixin.host = url.host;
	mixin.hostname = url.hostname;
	mixin.scheme = url.protocol.replace(/:$/, '');
	mixin.wsScheme = mixin.scheme.replace('http', 'ws');
	mixin.wsUrl = `${mixin.wsScheme}://${mixin.host}`;
	mixin.apiUrl = `${mixin.scheme}://${mixin.host}/api`;
	mixin.authUrl = `${mixin.scheme}://${mixin.host}/auth`;
	mixin.driveUrl = `${mixin.scheme}://${mixin.host}/files`;
	mixin.userAgent = `Misskey/${pkg.version} (${config.url})`;

	if (config.autoAdmin == null) config.autoAdmin = false;

	return Object.assign(config, mixin);
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
