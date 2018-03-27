/**
 * Config loader
 */

import * as fs from 'fs';
import { URL } from 'url';
import * as yaml from 'js-yaml';
import isUrl = require('is-url');

/**
 * Path of configuration directory
 */
const dir = `${__dirname}/../.config`;

/**
 * Path of configuration file
 */
export const path = process.env.NODE_ENV == 'test'
	? `${dir}/test.yml`
	: `${dir}/default.yml`;

/**
 * ユーザーが設定する必要のある情報
 */
type Source = {
	/**
	 * メンテナ情報
	 */
	maintainer: {
		/**
		 * メンテナの名前
		 */
		name: string;
		/**
		 * メンテナの連絡先(URLかmailto形式のURL)
		 */
		url: string;
	};
	url: string;
	port: number;
	https?: { [x: string]: string };
	mongodb: {
		host: string;
		port: number;
		db: string;
		user: string;
		pass: string;
	};
	redis: {
		host: string;
		port: number;
		pass: string;
	};
	elasticsearch: {
		enable: boolean;
		host: string;
		port: number;
		pass: string;
	};
	recaptcha: {
		site_key: string;
		secret_key: string;
	};
	accesslog?: string;
	accesses?: {
		enable: boolean;
		port: number;
	};
	twitter?: {
		consumer_key: string;
		consumer_secret: string;
	};
	github_bot?: {
		hook_secret: string;
		username: string;
	};
	othello_ai?: {
		id: string;
		i: string;
	};
	line_bot?: {
		channel_secret: string;
		channel_access_token: string;
	};
	analysis?: {
		mecab_command?: string;
	};

	/**
	 * Service Worker
	 */
	sw?: {
		public_key: string;
		private_key: string;
	};

	google_maps_api_key: string;
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
type Mixin = {
	host: string;
	hostname: string;
	scheme: string;
	ws_scheme: string;
	api_url: string;
	ws_url: string;
	auth_url: string;
	docs_url: string;
	stats_url: string;
	status_url: string;
	dev_url: string;
	drive_url: string;
};

export type Config = Source & Mixin;

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
	process.exit();
}
