/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { facialTissue_schema } from 'misskey-world/src/room/objects/facialTissue.schema.js';
import { i18n } from '@/i18n.js';

export const facialTissue_ui = defineFunitureUi<typeof facialTissue_schema>({
	name: i18n.ts._miRoom._objects.facialTissue,
	options: {},
});
