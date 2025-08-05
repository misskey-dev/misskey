import * as fs from 'fs/promises';
import url from 'node:url';
import path from 'node:path';
import os from 'node:os';
import { execa } from 'execa';
import locales from '../../locales/index.js';

// requires node 21 or later
// const __dirname = import.meta.dirname;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const buildDir = __dirname + '/build';
const outputDir = __dirname + '/../../built/_frontend_vite_';

/**
 * @param targetLocales {string[]}
 * @return {Promise<void>}
 */
async function viteBuild(targetLocales) {
	await execa('vite', ['build'], {
		cwd: __dirname,
		stdout: process.stdout,
		stderr: process.stderr,
		env: {
			'TARGET_LOCALE': targetLocales.join(','),
		},
	});
}

/**
 * @template T
 * @param array {T[]}
 * @param chunkSize {number}
 * @return {T[][]}
 */
function chunked(array, chunkSize) {
	if (chunkSize <= 0) {
		throw new Error('Chunk size must be greater than 0');
	}
	/** @type {T[][]} */
	const result = [];
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize));
	}
	return result;
}

async function buildAllLocale() {
	const localeNames = Object.keys(locales);
	const localePerProcess = Math.ceil(localeNames.length / os.cpus().length);
	const localeGroups = chunked(localeNames, localePerProcess);
	await Promise.all(
		localeGroups.map(locales => viteBuild(locales)),
	);
}

async function mergeLocales() {
	// merge build/* into __dirname + '/../../built/_frontend_vite_'
	await fs.rm(outputDir, { recursive: true, force: true });
	await fs.mkdir(outputDir, { recursive: true });
	for (const locale of await fs.readdir(outputDir)) {
		await fs.cp(
			`${buildDir}/${locale}`,
			`${outputDir}`,
			{
				recursive: true,
				force: true,
			},
		);
	}
}

async function build() {
	await fs.rm(buildDir, { recursive: true, force: true });
	await buildAllLocale();
	await mergeLocales();
}

await build();
