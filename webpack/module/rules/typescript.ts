/**
 * TypeScript
 */

export default () => ({
	test: /\.ts$/,
	loader: 'ts-loader',
	options: {
		configFile: __dirname + '/../../../src/web/app/tsconfig.json',
		appendTsSuffixTo: [/\.vue$/]
	}
});
