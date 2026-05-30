/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { beamLamp_schema } from 'misskey-world/src/room/furnitures/beamLamp.schema.js';
import { i18n } from '@/i18n.js';

export const beamLamp_ui = defineFurnitureUi<typeof beamLamp_schema>({
	name: i18n.ts._miRoom._objects.beamLamp,
	options: {},
});
