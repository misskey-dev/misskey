/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { stormGlass_schema } from 'misskey-world/src/room/objects/stormGlass.schema.js';
import { i18n } from '@/i18n.js';

export const stormGlass_ui = defineObjectUi<typeof stormGlass_schema>({
	name: i18n.ts._miRoom._objects.stormGlass,
	options: {},
});
