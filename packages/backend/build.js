import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import * as esbuild from 'esbuild';
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

//await minifyJsFiles(join(_dirname, 'node_modules'));

await minifyJsFiles(join(_dirname, '../../node_modules'));

await buildSrc();

async function buildSrc() {
	console.log(`[${_package.name}] start building...`);

	await esbuild.build(options)
		.then(() => {
			console.log(`[${_package.name}] build succeeded.`);
		})
		.catch((err) => {
			process.stderr.write(err.stderr || err.message || err);
			process.exit(1);
		});

	console.log(`[${_package.name}] finish building.`);
}

async function minifyJsFile(fullPath) {
	if (!fullPath.includes('node_modules') || fullPath.includes('storybook') || fullPath.includes('tensorflow') || fullPath.includes('vite') || fullPath.includes('vue') || fullPath.includes('esbuild') || fullPath.includes('typescript') || fullPath.includes('css') || fullPath.includes('lint') || fullPath.includes('roll') || fullPath.includes('sass')) {
		console.log(`Skipped: ${fullPath}`);
		return;
	}
	try {
		const data = fs.readFileSync(fullPath, 'utf-8');
		if (data.includes('0 && (module.exports')) {
			console.log(`Skipped: ${fullPath}`);
			return;
		}
		//await esbuild.build({
		//	entryPoints: [fullPath],
		//	minifyWhitespace: true,
		//	outdir: dirname(fullPath),
		//	allowOverwrite: true,
		//});
		const result = await esbuild.transform(data, {
			minifyWhitespace: true,
			minifyIdentifiers: true,
			minifySyntax: false, // nestjsが壊れる
			treeShaking: false,
		});
		fs.writeFileSync(fullPath, result.code, 'utf-8');
		console.log(`Minified: ${fullPath}`);
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (err) {
		console.log(`Skipped (error): ${fullPath}`);
	}
}

async function minifyJsFiles(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			await minifyJsFiles(fullPath);
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			await minifyJsFile(fullPath);
		} else {
			// resolve symbolic link
			const stats = fs.lstatSync(fullPath);
			if (stats.isSymbolicLink()) {
				const realPath = fs.realpathSync(fullPath);
				const realStats = fs.statSync(realPath);
				if (realStats.isDirectory()) {
					await minifyJsFiles(realPath);
				} else if (realStats.isFile() && realPath.endsWith('.js')) {
					await minifyJsFile(realPath);
				}
			}
		}
	}
}
