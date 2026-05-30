/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { woodSoundAbsorbingPanel_schema } from 'misskey-world/src/room/objects/woodSoundAbsorbingPanel.schema.js';
import { i18n } from '@/i18n.js';

export const woodSoundAbsorbingPanel_ui = defineFunitureUi<typeof woodSoundAbsorbingPanel_schema>({
	name: i18n.ts._miRoom._objects.woodSoundAbsorbingPanel,
	options: {},
});
