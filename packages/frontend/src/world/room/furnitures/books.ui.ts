/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { books_schema } from 'misskey-world/src/room/furnitures/books.schema.js';
import { i18n } from '@/i18n.js';

export const books_ui = defineFurnitureUi<typeof books_schema>({
	name: i18n.ts._miRoom._objects.books,
	options: {
		variation: {
			label: i18n.ts._miRoom._objects._books.variation,
			enum: {
				'A': {
					label: 'A',
				},
				'B': {
					label: 'B',
				},
				'C': {
					label: 'C',
				},
				'D': {
					label: 'D',
				},
				'E': {
					label: 'E',
				},
			},
		},
	},
});
