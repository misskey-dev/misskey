/**
 * Config loader
 */

import * as fs from 'fs';
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
	secondary_url: string;
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
	scheme: string;
	secondary_host: string;
	secondary_scheme: string;
	api_url: string;
	auth_url: string;
	docs_url: string;
	ch_url: string;
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
	if (!isUrl(config.secondary_url)) urlError(config.secondary_url);

	config.url = normalizeUrl(config.url);
	config.secondary_url = normalizeUrl(config.secondary_url);

	mixin.host = config.url.substr(config.url.indexOf('://') + 3);
	mixin.scheme = config.url.substr(0, config.url.indexOf('://'));
	mixin.secondary_host = config.secondary_url.substr(config.secondary_url.indexOf('://') + 3);
	mixin.secondary_scheme = config.secondary_url.substr(0, config.secondary_url.indexOf('://'));
	mixin.api_url = `${mixin.scheme}://api.${mixin.host}`;
	mixin.auth_url = `${mixin.scheme}://auth.${mixin.host}`;
	mixin.ch_url = `${mixin.scheme}://ch.${mixin.host}`;
	mixin.dev_url = `${mixin.scheme}://dev.${mixin.host}`;
	mixin.docs_url = `${mixin.scheme}://docs.${mixin.host}`;
	mixin.stats_url = `${mixin.scheme}://stats.${mixin.host}`;
	mixin.status_url = `${mixin.scheme}://status.${mixin.host}`;
	mixin.drive_url = `${mixin.secondary_scheme}://file.${mixin.secondary_host}`;

	return Object.assign(config, mixin);
}

function normalizeUrl(url: string) {
	return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
}

function urlError(url: string) {
	console.error(`「${url}」は、正しいURLではありません。先頭に http:// または https:// をつけ忘れてないかなど確認してください。`);
	process.exit();
}
