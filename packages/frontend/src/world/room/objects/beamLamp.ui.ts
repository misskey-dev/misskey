/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { beamLamp_schema } from 'misskey-world/src/room/objects/beamLamp.schema.js';
import { i18n } from '@/i18n.js';

export const beamLamp_ui = defineObjectUi<typeof beamLamp_schema>({
	name: i18n.ts._miRoom._objects.beamLamp,
	options: {},
});
