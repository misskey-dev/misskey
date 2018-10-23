/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import * as yaml from 'js-yaml';
import { Source, Mixin } from './types';
import isUrl = require('is-url');
const pkg = require('../../package.json');

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
	const config = yaml.safeLoad(fs.readFileSync(path, 'utf-8')) as Source;

	const mixin = {} as Mixin;

	// Validate URLs
	if (!isUrl(config.url)) throw `url="${config.url}" is not a valid URL`;

	const url = new URL(config.url);
	config.url = normalizeUrl(config.url);

	mixin.host = url.host;
	mixin.hostname = url.hostname;
	mixin.scheme = url.protocol.replace(/:$/, '');
	mixin.ws_scheme = mixin.scheme.replace('http', 'ws');
	mixin.ws_url = `${mixin.ws_scheme}://${mixin.host}`;
	mixin.api_url = `${mixin.scheme}://${mixin.host}/api`;
	mixin.auth_url = `${mixin.scheme}://${mixin.host}/auth`;
	mixin.dev_url = `${mixin.scheme}://${mixin.host}/dev`;
	mixin.docs_url = `${mixin.scheme}://${mixin.host}/docs`;
	mixin.stats_url = `${mixin.scheme}://${mixin.host}/stats`;
	mixin.status_url = `${mixin.scheme}://${mixin.host}/status`;
	mixin.drive_url = `${mixin.scheme}://${mixin.host}/files`;
	mixin.user_agent = `Misskey/${pkg.version} (${config.url})`;

	if (config.localDriveCapacityMb == null) config.localDriveCapacityMb = 256;
	if (config.remoteDriveCapacityMb == null) config.remoteDriveCapacityMb = 8;

	if (config.maxNoteTextLength == null) config.maxNoteTextLength = 1000;

	if (config.name == null) config.name = 'Misskey';

	return Object.assign(config, mixin);
}

function normalizeUrl(url: string) {
	return url.endsWith('/') ? url.substr(0, url.length - 1) : url;
}
