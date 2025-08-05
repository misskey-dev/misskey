import * as fs from 'fs/promises';
import url from 'node:url';
import path from 'node:path';
import { execa } from 'execa';
import locales from '../../locales/index.js';

// requires node 21 or later
// const __dirname = import.meta.dirname;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const outputDir = __dirname + '/../../built/_frontend_vite_';

/**
 * @return {Promise<void>}
 */
async function viteBuild() {
	await execa('vite', ['build'], {
		cwd: __dirname,
		stdout: process.stdout,
		stderr: process.stderr,
	});
}

async function buildAllLocale() {
	// TODO: inline locales where possible
	// currently just copies scrips directory to each locale directory

	const localeNames = Object.keys(locales);
	for (const localeName of localeNames) {
		const localeDir = path.join(outputDir, localeName);
		await fs.mkdir(outputDir, { recursive: true });
		await fs.cp(
			`${outputDir}/scripts`,
			`${localeDir}`,
			{
				force: true,
				recursive: true,
			},
		);
	}
}

async function build() {
	await viteBuild();
	await buildAllLocale();
}

await build();
