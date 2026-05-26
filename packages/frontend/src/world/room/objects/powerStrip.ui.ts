/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { powerStrip_schema } from 'misskey-world/src/room/objects/powerStrip.schema.js';
import { i18n } from '@/i18n.js';

export const powerStrip_ui = defineObjectUi<typeof powerStrip_schema>({
	name: i18n.ts._miRoom._objects.powerStrip,
	options: {},
});
