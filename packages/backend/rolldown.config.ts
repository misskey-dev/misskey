import { defineConfig } from 'rolldown';
import esmShim from '@rollup/plugin-esm-shim';

export default defineConfig([{
	input: [
		'./src/boot/entry.ts',
		'./src/boot/cli.ts',
		'./src/config.ts',
		'./src/postgres.ts',
		'./src/server/api/openapi/gen-spec.ts',
	],
	platform: 'node',
	tsconfig: true,
	plugins: [
		esmShim(),
	],
	output: {
		keepNames: true,
		minify: true,
		sourcemap: true,
		dir: './built',
		cleanDir: true,
		format: 'esm',
	},
	external: [
		/^slacc-.*/,
		'class-transformer',
		'class-validator',
		/^@sentry\/.*/,
		/^@sentry-internal\/.*/,
		'@nestjs/websockets/socket-module',
		'@nestjs/microservices/microservices-module',
		'@nestjs/microservices',
		/^@napi-rs\/.*/,
		'mock-aws-s3',
		'aws-sdk',
		'nock',
		'sharp',
		'jsdom',
		're2',
		'ipaddr.js',
		'oauth2orize',
	],
}]);
