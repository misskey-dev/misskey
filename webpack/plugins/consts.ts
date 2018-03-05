/**
 * Constant Replacer
 */

import * as webpack from 'webpack';

const meta = require('../../package.json');
const version = meta.version;

const constants = require('../../src/const.json');
import config from '../../src/conf';
import { licenseHtml } from '../../src/common/build/license';

export default lang => {
	const consts = {
		_RECAPTCHA_SITEKEY_: config.recaptcha.site_key,
		_SW_PUBLICKEY_: config.sw ? config.sw.public_key : null,
		_THEME_COLOR_: constants.themeColor,
		_COPYRIGHT_: constants.copyright,
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
		_LICENSE_: licenseHtml,
		_GOOGLE_MAPS_API_KEY_: config.google_maps_api_key
	};

	const _consts = {};

	Object.keys(consts).forEach(key => {
		_consts[key] = JSON.stringify(consts[key]);
	});

	return new webpack.DefinePlugin(_consts);
};
