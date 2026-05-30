/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { openedCardboardBox_schema } from 'misskey-world/src/room/objects/openedCardboardBox.schema.js';
import { i18n } from '@/i18n.js';

export const openedCardboardBox_ui = defineFunitureUi<typeof openedCardboardBox_schema>({
	name: i18n.ts._miRoom._objects.openedCardboardBox,
	options: {},
});
