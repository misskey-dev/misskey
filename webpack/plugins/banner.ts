import * as os from 'os';
import * as webpack from 'webpack';

export default version => new webpack.BannerPlugin({
	banner:
		`Misskey v${version} | MIT Licensed, (c) syuilo 2014-2018\n` +
		'https://github.com/syuilo/misskey\n' +
		`built by ${os.hostname()} at ${new Date()}\n` +
		'hash:[hash], chunkhash:[chunkhash]'
});
