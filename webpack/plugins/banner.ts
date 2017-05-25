import * as webpack from 'webpack';

export default version => new webpack.BannerPlugin({
	banner: `Misskey v${version} - built at ${new Date()} | (c) syuilo 2014-2017
		hash:[hash], chunkhash:[chunkhash], name:[name], filebase:[filebase], query:[query], file:[file]`
});
