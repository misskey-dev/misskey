/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { woodSoundAbsorbingPanel_schema } from 'misskey-world/src/room/furnitures/woodSoundAbsorbingPanel.schema.js';
import { i18n } from '@/i18n.js';

export const woodSoundAbsorbingPanel_ui = defineFurnitureUi<typeof woodSoundAbsorbingPanel_schema>({
	name: i18n.ts._miRoom._furnitures.woodSoundAbsorbingPanel,
	options: {},
});
