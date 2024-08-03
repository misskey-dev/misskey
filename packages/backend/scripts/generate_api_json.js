/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execa } from 'execa';
import { writeFileSync, existsSync } from "node:fs";

async function main() {
	if (!process.argv.includes('--no-build')) {
		await execa('pnpm', ['run', 'build'], {
			stdout: process.stdout,
			stderr: process.stderr,
		});
	}

	if (!existsSync('./built')) {
		throw new Error('`built` directory does not exist.');
	}

	/** @type {import('../src/config.js')} */
	const { loadConfig } = await import('../built/config.js');

	/** @type {import('../src/server/api/openapi/gen-spec.js')} */
	const { genOpenapiSpec } = await import('../built/server/api/openapi/gen-spec.js');

	const config = loadConfig();
	const spec = genOpenapiSpec(config, true);

	writeFileSync('./built/api.json', JSON.stringify(spec), 'utf-8');
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
