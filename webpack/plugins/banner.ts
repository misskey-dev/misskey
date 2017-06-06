import * as webpack from 'webpack';

export default version => new webpack.BannerPlugin({
	banner:
		`Misskey v${version} | MIT Licensed, (c) syuilo 2014-2017\n` +
		'https://github.com/syuilo/misskey\n' +
		`built at ${new Date()}\n` +
		'hash:[hash], chunkhash:[chunkhash]'
});
