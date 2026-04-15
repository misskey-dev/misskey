import { defineConfig } from 'rolldown';
import type { InputOption } from 'rolldown';
import esmShim from '@rollup/plugin-esm-shim';

export default defineConfig((args) => {
	let input: InputOption;
	const isE2E = (args.mode != null && args.mode === 'e2e');
	let enableSourcemap = (args.sourcemap != null && args.sourcemap !== 'false');

	if (isE2E) {
		input = './test-server/entry.ts';
		enableSourcemap = true;
	} else {
		input = [
			'./src/boot/entry.ts',
			'./src/boot/cli.ts',
			'./src/config.ts',
			'./src/postgres.ts',
			'./src/server/api/openapi/gen-spec.ts',
		];
	}

	return {
		input,
		platform: 'node',
		tsconfig: true,
		plugins: [
			esmShim(),
		],
		output: {
			keepNames: true,
			minify: true,
			sourcemap: enableSourcemap,
			dir: isE2E ? './built-test' : './built',
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
	};
});
