/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { desk_schema } from 'misskey-world/src/room/objects/desk.schema.js';
import { i18n } from '@/i18n.js';

export const desk_ui = defineFunitureUi<typeof desk_schema>({
	name: i18n.ts._miRoom._objects.desk,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._desk.frameMat,
		},
		boardMat: {
			label: i18n.ts._miRoom._objects._desk.boardMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._desk.width,
		},
		depth: {
			label: i18n.ts._miRoom._objects._desk.depth,
		},
	},
});
