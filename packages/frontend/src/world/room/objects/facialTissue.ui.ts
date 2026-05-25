/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { facialTissue } from './facialTissue.js';
import { i18n } from '@/i18n.js';

export const facialTissue_ui = defineObjectUi<typeof facialTissue>({
	name: i18n.ts._miRoom._objects.facialTissue,
	options: {},
});
