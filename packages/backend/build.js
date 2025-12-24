import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { swcPlugin } from 'esbuild-plugin-swc';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);
const _package = JSON.parse(fs.readFileSync(_dirname + '/package.json', 'utf-8'));

const resolveTsPathsPlugin = {
	name: 'resolve-ts-paths',
	setup(build) {
		build.onResolve({ filter: /^\.{1,2}\/.*\.js$/ }, (args) => {
			if (args.importer) {
				const absPath = join(args.resolveDir, args.path);
				const tsPath = absPath.slice(0, -3) + '.ts';
				if (fs.existsSync(tsPath)) return { path: tsPath };
				const tsxPath = absPath.slice(0, -3) + '.tsx';
				if (fs.existsSync(tsxPath)) return { path: tsxPath };
			}
		});
	},
};

const externalIpaddrPlugin = {
	name: 'external-ipaddr',
	setup(build) {
		build.onResolve({ filter: /^ipaddr\.js$/ }, (args) => {
			return { path: args.path, external: true };
		});
	},
};

/** @type {import('esbuild').BuildOptions} */
const options = {
	entryPoints: ['./src/boot/entry.ts'],
	minify: true,
	keepNames: true,
	bundle: true,
	outdir: './built/boot',
	target: 'node22',
	platform: 'node',
	format: 'esm',
	sourcemap: 'linked',
	packages: 'external',
	banner: {
		js: 'import { createRequire as topLevelCreateRequire } from "module";' +
			'import ___url___ from "url";' +
			'const require = topLevelCreateRequire(import.meta.url);' +
			'const __filename = ___url___.fileURLToPath(import.meta.url);' +
			'const __dirname = ___url___.fileURLToPath(new URL(".", import.meta.url));',
	},
	plugins: [
		externalIpaddrPlugin,
		resolveTsPathsPlugin,
		swcPlugin({
			jsc: {
				parser: {
					syntax: 'typescript',
					decorators: true,
					dynamicImport: true,
				},
				transform: {
					legacyDecorator: true,
					decoratorMetadata: true,
				},
				experimental: {
					keepImportAssertions: true,
				},
				baseUrl: join(_dirname, 'src'),
				paths: {
					'@/*': ['*'],
				},
				target: 'esnext',
				keepClassNames: true,
			},
		}),
		externalIpaddrPlugin,
	],
	// external: [
	// 	'slacc-*',
	// 	'class-transformer',
	// 	'class-validator',
	// 	'@sentry/*',
	// 	'@nestjs/websockets/socket-module',
	// 	'@nestjs/microservices/microservices-module',
	// 	'@nestjs/microservices',
	// 	'@napi-rs/canvas-win32-x64-msvc',
	// 	'mock-aws-s3',
	// 	'aws-sdk',
	// 	'nock',
	// 	'sharp',
	// 	'jsdom',
	// 	're2',
	// 	'@napi-rs/canvas',
	// ],
};

const args = process.argv.slice(2).map(arg => arg.toLowerCase());

if (!args.includes('--no-clean')) {
	fs.rmSync('./built', { recursive: true, force: true });
}

await buildSrc();

async function buildSrc() {
	console.log(`[${_package.name}] start building...`);

	await build(options)
		.then(() => {
			console.log(`[${_package.name}] build succeeded.`);
		})
		.catch((err) => {
			process.stderr.write(err.stderr || err.message || err);
			process.exit(1);
		});

	console.log(`[${_package.name}] finish building.`);
}
