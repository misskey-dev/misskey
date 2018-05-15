/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import * as yaml from 'js-yaml';
import { Source, Mixin } from './types';
import isUrl = require('is-url');

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
	if (!isUrl(config.url)) urlError(config.url);

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

	return Object.assign(config, mixin);
}

function normalizeUrl(url: string) {
	return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
}

function urlError(url: string) {
	console.error(`「${url}」は、正しいURLではありません。先頭に http:// または https:// をつけ忘れてないかなど確認してください。`);
	process.exit(99);
}
