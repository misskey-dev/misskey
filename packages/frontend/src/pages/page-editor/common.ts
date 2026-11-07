/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';

export function getPageBlockList() {
	return [
		{ value: 'section', label: i18n.ts._pages.blocks.section },
		{ value: 'text', label: i18n.ts._pages.blocks.text },
		{ value: 'image', label: i18n.ts._pages.blocks.image },
		{ value: 'note', label: i18n.ts._pages.blocks.note },
	] as const satisfies MkSelectItem[];
}
