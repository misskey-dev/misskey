/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { book_schema } from 'misskey-world/src/room/objects/book.schema.js';
import { i18n } from '@/i18n.js';

export const book_ui = defineFunitureUi<typeof book_schema>({
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
