/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { wallShelf_schema } from 'misskey-world/src/room/objects/wallShelf.schema.js';
import { i18n } from '@/i18n.js';

export const wallShelf_ui = defineFunitureUi<typeof wallShelf_schema>({
	name: i18n.ts._miRoom._objects.wallShelf,
	options: {
		style: {
			label: i18n.ts._miRoom._objects._wallShelf.style,
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
			},
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._wallShelf.boardMat,
		},
	},
});
