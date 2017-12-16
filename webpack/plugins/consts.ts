/**
 * Constant Replacer
 */

import * as webpack from 'webpack';

import version from '../../src/version';
const constants = require('../../src/const.json');
import config from '../../src/conf';

export default lang => {
	const consts = {
		_RECAPTCHA_SITEKEY_: config.recaptcha.site_key,
		_SW_PUBLICKEY_: config.sw ? config.sw.public_key : null,
		_THEME_COLOR_: constants.themeColor,
		_VERSION_: version,
		_STATUS_URL_: config.status_url,
		_STATS_URL_: config.stats_url,
		_DOCS_URL_: config.docs_url,
		_API_URL_: config.api_url,
		_DEV_URL_: config.dev_url,
		_CH_URL_: config.ch_url,
		_LANG_: lang,
		_HOST_: config.host,
		_URL_: config.url,
	};

	const _consts = {};

	Object.keys(consts).forEach(key => {
		_consts[key] = JSON.stringify(consts[key]);
	});

	return new webpack.DefinePlugin(Object.assign({}, _consts, {
		__CONSTS__: JSON.stringify(consts)
	}));
};
