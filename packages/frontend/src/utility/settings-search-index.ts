/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { searchIndexes as generated } from 'search-index:settings';
import type { GeneratedSearchIndexItem } from 'search-index:settings';

export type SearchIndexItem = {
	id: string;
	path?: string;
	label: string;
	keywords: string[];
	icon?: string;
	children?: SearchIndexItem[];
};

const rootMods = new Map(generated.map(item => [item.id, item]));

function walk(item: GeneratedSearchIndexItem) {
	if (item.inlining) {
		for (const id of item.inlining) {
			const inline = rootMods.get(id);
			if (inline) {
				(item.children ??= []).push(inline);
				rootMods.delete(id);
			} else {
				console.log('[Settings Search Index] Failed to inline', id);
			}
		}
	}

	for (const child of item.children ?? []) {
		walk(child);
	}
}

for (const item of generated) {
	walk(item);
}

export const searchIndexes: SearchIndexItem[] = generated;

