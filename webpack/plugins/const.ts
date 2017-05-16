/**
 * Constant Replacer
 */

import * as webpack from 'webpack';

import version from '../../src/version';
const constants = require('../../src/const.json');

export default () => new webpack.DefinePlugin({
	VERSION: JSON.stringify(version),
	THEME_COLOR: JSON.stringify(constants.themeColor)
});
