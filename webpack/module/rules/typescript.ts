/**
 * TypeScript
 */

export default () => ({
	test: /\.ts$/,
	exclude: /node_modules/,
	loader: 'ts-loader',
	options: {
		configFile: __dirname + '/../../../src/web/app/tsconfig.json',
		appendTsSuffixTo: [/\.vue$/]
	}
});
