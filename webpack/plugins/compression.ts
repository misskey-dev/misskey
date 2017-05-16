/**
 * Compressor
 */

const CompressionPlugin = require('compression-webpack-plugin');

export default () => new CompressionPlugin({
	deleteOriginalAssets: true
});
