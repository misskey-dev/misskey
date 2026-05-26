/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { mixer_schema } from 'misskey-world/src/room/objects/mixer.schema.js';
import { i18n } from '@/i18n.js';

export const mixer_ui = defineObjectUi<typeof mixer_schema>({
	name: i18n.ts._miRoom._objects.mixer,
	options: {},
});
