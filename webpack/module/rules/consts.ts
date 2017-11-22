/**
 * Replace consts
 */

const StringReplacePlugin = require('string-replace-webpack-plugin');

import version from '../../../src/version';
const constants = require('../../../src/const.json');
import config from '../../../src/conf';

export default lang => {
	// 置換の誤爆を防ぐため文字数の多い順に並べてください
	const consts = {
		_RECAPTCHA_SITEKEY_: JSON.stringify(config.recaptcha.site_key),
		_SW_PUBLICKEY_: JSON.stringify(config.sw.public_key),
		_THEME_COLOR_: JSON.stringify(constants.themeColor),
		_VERSION_: JSON.stringify(version),
		_STATUS_URL_: JSON.stringify(config.status_url),
		_STATS_URL_: JSON.stringify(config.stats_url),
		_ABOUT_URL_: JSON.stringify(config.about_url),
		_API_URL_: JSON.stringify(config.api_url),
		_DEV_URL_: JSON.stringify(config.dev_url),
		_CH_URL_: JSON.stringify(config.ch_url),
		_LANG_: JSON.stringify(lang),
		_HOST_: JSON.stringify(config.host),
		_URL_: JSON.stringify(config.url),
	};

	const replacements = Object.keys(consts).map(key => ({
		pattern: new RegExp(key, 'g'), replacement: () => consts[key]
	}));

	return {
		enforce: 'post',
		test: /\.(tag|js|ts)$/,
		exclude: /node_modules/,
		loader: StringReplacePlugin.replace({
			replacements: replacements
		})
	};
};
