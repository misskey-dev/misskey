/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { curtain } from './curtain.js';
import { i18n } from '@/i18n.js';

export const curtain_ui = defineObjectUi<typeof curtain>({
	name: i18n.ts._miRoom._objects.curtain,
	options: {},
});
