/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { ductTape } from './ductTape.js';
import { i18n } from '@/i18n.js';

export const ductTape_ui = defineObjectUi<typeof ductTape>({
	name: i18n.ts._miRoom._objects.ductTape,
	options: {},
});
