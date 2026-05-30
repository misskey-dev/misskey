/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { a4Case_schema } from 'misskey-world/src/room/furnitures/a4Case.schema.js';
import { i18n } from '@/i18n.js';

export const a4Case_ui = defineFurnitureUi<typeof a4Case_schema>({
	name: i18n.ts._miRoom._objects.a4Case,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._a4Case.mat,
		},
	},
});
