/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { woodSoundAbsorbingPanel } from './woodSoundAbsorbingPanel.js';
import { i18n } from '@/i18n.js';

export const woodSoundAbsorbingPanel_ui = defineObjectUi<typeof woodSoundAbsorbingPanel>({
	name: i18n.ts._miRoom._objects.woodSoundAbsorbingPanel,
	options: {},
});
