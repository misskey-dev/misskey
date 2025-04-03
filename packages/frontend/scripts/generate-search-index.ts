/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchIndexes } from '../vite.config.js';
import { generateSearchIndex, MarkerIdAssigner } from '../lib/vite-plugin-create-search-index.js';

async function main() {
	const assigner = new MarkerIdAssigner();
	for (const searchIndex of searchIndexes) {
		await generateSearchIndex(searchIndex, assigner);
	}
}

main();
