/**
 * Config loader
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { Source, Mixin } from './types';
import * as meta from '../meta.json';

/**
 * Path of configuration directory
 */
const dir = `${__dirname}/../../.config`;

/**
 * Path of configuration file
 */
const path = process.env.NODE_ENV === 'test'
	? `${dir}/test.yml`
	: `${dir}/default.yml`;

export default function load() {
	const config = yaml.load(fs.readFileSync(path, 'utf-8')) as Source;

	const mixin = {} as Mixin;

	const url = tryCreateUrl(config.url);

	config.url = url.origin;

	config.port = config.port || parseInt(process.env.PORT || '', 10);

	mixin.version = meta.version;
	mixin.host = url.host;
	mixin.hostname = url.hostname;
	mixin.scheme = url.protocol.replace(/:$/, '');
	mixin.wsScheme = mixin.scheme.replace('http', 'ws');
	mixin.wsUrl = `${mixin.wsScheme}://${mixin.host}`;
	mixin.apiUrl = `${mixin.scheme}://${mixin.host}/api`;
	mixin.authUrl = `${mixin.scheme}://${mixin.host}/auth`;
	mixin.driveUrl = `${mixin.scheme}://${mixin.host}/files`;
	mixin.userAgent = `Misskey/${meta.version} (${config.url})`;

	if (!config.redis.prefix) config.redis.prefix = mixin.host;

	return Object.assign(config, mixin);
}

function tryCreateUrl(url: string) {
	try {
		return new URL(url);
	} catch (e) {
		throw `url="${url}" is not a valid URL.`;
	}
}
