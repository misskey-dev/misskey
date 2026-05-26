/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { hangingTShirt_schema } from 'misskey-world/src/room/objects/hangingTShirt.schema.js';
import { i18n } from '@/i18n.js';

export const hangingTShirt_ui = defineObjectUi<typeof hangingTShirt_schema>({
	name: i18n.ts._miRoom._objects.hangingTShirt,
	options: {},
});
