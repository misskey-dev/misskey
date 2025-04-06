/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

declare module 'search-index:settings' {
	export type GeneratedSearchIndexItem = {
		id: string;
		parentId?: string;
		path?: string;
		label: string;
		keywords: string[];
		icon?: string;
		inlining?: string[];
	};

	export const searchIndexes: GeneratedSearchIndexItem[];
}
