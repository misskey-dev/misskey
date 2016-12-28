/**
 * Config loader
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';

/**
 * ユーザーが設定する必要のある情報
 */
interface ISource {
	maintainer: string;
	url: string;
	secondary_url: string;
	port: number;
	https: {
		enable: boolean;
		key: string;
		cert: string;
		ca: string;
	};
	mongodb: {
		host: string;
		port: number;
		db: string;
		user_id: string;
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
		siteKey: string;
		secretKey: string;
	};
}

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
interface Mixin {
	themeColor: string;
	themeColorForeground: string;
	host: string;
	scheme: string;
	secondary_host: string;
	secondary_scheme: string;
	api_url: string;
	auth_url: string;
	dev_url: string;
	drive_url: string;
	proxy_url: string;
}

export type IConfig = ISource & Mixin;

/**
 * 設定を取得します
 * @param  {string} path 設定ファイルのパス
 * @return {IConfig}     設定
 */
export default (path: string) => {
	const config = yaml.safeLoad(fs.readFileSync(path, 'utf8')) as ISource;

	const mixin: Mixin = {} as Mixin;

	config.url = normalizeUrl(config.url);
	config.secondary_url = normalizeUrl(config.secondary_url);

	mixin.themeColor = '#f76d6c';
	mixin.themeColorForeground = '#fff';
	mixin.host = config.url.substr(config.url.indexOf('://') + 3);
	mixin.scheme = config.url.substr(0, config.url.indexOf('://'));
	mixin.secondary_host = config.secondary_url.substr(config.secondary_url.indexOf('://') + 3);
	mixin.secondary_scheme = config.secondary_url.substr(0, config.secondary_url.indexOf('://'));
	mixin.api_url = `${mixin.scheme}://api.${mixin.host}`;
	mixin.auth_url = `${mixin.scheme}://auth.${mixin.host}`;
	mixin.dev_url = `${mixin.scheme}://dev.${mixin.host}`;
	mixin.drive_url = `${mixin.secondary_scheme}://file.${mixin.secondary_host}`;
	mixin.proxy_url = `${mixin.secondary_scheme}://proxy.${mixin.secondary_host}`;

	return Object.assign(config || {}, mixin) as IConfig;
};

function normalizeUrl(url: string): string {
	return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
}
