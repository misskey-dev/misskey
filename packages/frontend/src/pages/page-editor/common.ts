/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';

export function getPageBlockList() {
	return [
		{ value: 'section', text: i18n.ts._pages.blocks.section },
		{ value: 'text', text: i18n.ts._pages.blocks.text },
		{ value: 'image', text: i18n.ts._pages.blocks.image },
		{ value: 'note', text: i18n.ts._pages.blocks.note },
	];
}
