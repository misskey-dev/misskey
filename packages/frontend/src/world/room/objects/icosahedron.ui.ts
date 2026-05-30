/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { icosahedron_schema } from 'misskey-world/src/room/objects/icosahedron.schema.js';
import { i18n } from '@/i18n.js';

export const icosahedron_ui = defineFunitureUi<typeof icosahedron_schema>({
	name: i18n.ts._miRoom._objects.icosahedron,
	options: {
		mat: {
			label: i18n.ts._miRoom._objects._icosahedron.mat,
		},
	},
});
