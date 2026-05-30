/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { sofa_schema } from 'misskey-world/src/room/objects/sofa.schema.js';
import { i18n } from '@/i18n.js';

export const sofa_ui = defineFunitureUi<typeof sofa_schema>({
	name: i18n.ts._miRoom._objects.sofa,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._sofa.bodyMat,
		},
	},
});
