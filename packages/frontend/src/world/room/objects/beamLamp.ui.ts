/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { beamLamp_schema } from 'misskey-world/src/room/objects/beamLamp.schema.js';
import { i18n } from '@/i18n.js';

export const beamLamp_ui = defineFunitureUi<typeof beamLamp_schema>({
	name: i18n.ts._miRoom._objects.beamLamp,
	options: {},
});
