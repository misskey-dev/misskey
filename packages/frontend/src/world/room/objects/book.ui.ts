/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { book_schema } from './book.schema.js';
import { i18n } from '@/i18n.js';

export const book_ui = defineObjectUi<typeof book_schema>({
	name: i18n.ts._miRoom._objects.book,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._book.variation,
		},
		width: {
			label: i18n.ts._miRoom._objects._book.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._book.height,
		},
		thickness: {
			label: i18n.ts._miRoom._objects._book.thickness,
		},
	},
});
