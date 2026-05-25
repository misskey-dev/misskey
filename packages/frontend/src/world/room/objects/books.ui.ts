/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { books } from './books.js';
import { i18n } from '@/i18n.js';

export const books_ui = defineObjectUi<typeof books>({
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
