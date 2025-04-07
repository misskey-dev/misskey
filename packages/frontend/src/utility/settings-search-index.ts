/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchIndexes as generated } from 'search-index:settings';
import type { GeneratedSearchIndexItem } from 'search-index:settings';

export type SearchIndexItem = {
	id: string;
	parentId?: string;
	path?: string;
	label: string;
	keywords: string[];
	icon?: string;
};

const rootMods = new Map(generated.map(item => [item.id, item]));

// link inlining here
for (const item of generated) {
	if (item.inlining) {
		for (const id of item.inlining) {
			const inline = rootMods.get(id);
			if (inline) {
				inline.parentId = item.id;
			} else {
				console.log('[Settings Search Index] Failed to inline', id);
			}
		}
	}
}

export const searchIndexes: SearchIndexItem[] = generated;

