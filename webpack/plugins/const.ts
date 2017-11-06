/**
 * Constant Replacer
 */

import * as webpack from 'webpack';

import version from '../../src/version';
const constants = require('../../src/const.json');

export default lang => new webpack.DefinePlugin({
	VERSION: JSON.stringify(version),
	LANG: JSON.stringify(lang),
	THEME_COLOR: JSON.stringify(constants.themeColor)
});
