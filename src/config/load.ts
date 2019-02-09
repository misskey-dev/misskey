/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import * as yaml from 'js-yaml';
import { Source, Mixin } from './types';
import Mika, { optional } from '../sanctuary/mika';
import * as pkg from '../../package.json';
import Logger from '../misc/logger';

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
	const config: Source = yaml.safeLoad(fs.readFileSync(path, 'utf-8'));

	const logger = new Logger('config');

	const errors = new Mika({
		repository_url: 'string!?',
		feedback_url: 'string!?',
		url: 'string!',
		port: 'number!',
		https: {
			[optional]: true,
			key: 'string!',
			cert: 'string!'
		},
		disableHsts: 'boolean!?',
		mongodb: {
			host: 'string!',
			port: 'number!',
			db: 'string!',
			user: 'string!?',
			pass: 'string!?'
		},
		elasticsearch: {
			[optional]: true,
			host: 'string!',
			port: 'number!',
			pass: 'string!'
		},
		drive: {
			[optional]: true,
			storage: 'string!?'
		},
		redis: {
			[optional]: true,
			host: 'string!',
			port: 'number!',
			pass: 'string!'
		},
		autoAdmin: 'boolean!?',
		proxy: 'string!?',
		accesslog: 'string!?',
		clusterLimit: 'number!?',
		// The below properties are defined for backward compatibility.
		name: 'string!?',
		description: 'string!?',
		localDriveCapacityMb: 'number!?',
		remoteDriveCapacityMb: 'number!?',
		preventCacheRemoteFiles: 'boolean!?',
		recaptcha: {
			[optional]: true,
			enableRecaptcha: 'boolean!?',
			recaptchaSiteKey: 'string!?',
			recaptchaSecretKey: 'string!?'
		},
		ghost: 'string!?',
		maintainer: {
			[optional]: true,
			name: 'string!',
			email: 'string!?'
		},
		twitter: {
			[optional]: true,
			consumer_key: 'string!?',
			consumer_secret: 'string!?'
		},
		github: {
			[optional]: true,
			client_id: 'string!?',
			client_secret: 'string!?'
		},
		user_recommendation: {
			[optional]: true,
			engine: 'string!?',
			timeout: 'number!?'
		},
		sw: {
			[optional]: true,
			public_key: 'string!',
			private_key: 'string!'
		}
	}).validate(config);

	if (!errors && config.drive.storage === 'minio') {
		const minioErrors = new Mika({
			bucket: 'string!',
			prefix: 'string!',
			baseUrl: 'string!',
			config: {
				endPoint: 'string!',
				accessKey: 'string!',
				secretKey: 'string!',
				useSSL: 'boolean!?',
				port: 'number!?',
				region: 'string!?',
				transport: 'string!?',
				sessionToken: 'string!?',
			}
		}).validate(config.drive);

		if (minioErrors)
			for (const error of minioErrors)
				errors.push(error);
	}

	if (errors) {
		for (const { path, excepted, actual } of errors)
			logger.error(`Invalid config value detected at ${path}: excepted type is ${typeof excepted === 'string' ? excepted : 'object'}, but actual value type is ${actual}`);

		throw 'The configuration is invalid. Check your .config/default.yml';
	}

	const url = validateUrl(config.url);
	config.url = normalizeUrl(config.url);

	const scheme = url.protocol.replace(/:$/, '');
	const ws_scheme = scheme.replace('http', 'ws');

	const mixin: Mixin = {
		host: url.host,
		hostname: url.hostname,
		scheme,
		ws_scheme,
		ws_url: `${ws_scheme}://${url.host}`,
		api_url: `${scheme}://${url.host}/api`,
		auth_url: `${scheme}://${url.host}/auth`,
		dev_url: `${scheme}://${url.host}/dev`,
		docs_url: `${scheme}://${url.host}/docs`,
		stats_url: `${scheme}://${url.host}/stats`,
		status_url: `${scheme}://${url.host}/status`,
		drive_url: `${scheme}://${url.host}/files`,
		user_agent: `Misskey/${pkg.version} (${config.url})`
	};

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
