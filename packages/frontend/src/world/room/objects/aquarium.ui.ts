/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { aquarium } from './aquarium.js';
import { i18n } from '@/i18n.js';

export const aquarium_ui = defineObjectUi<typeof aquarium>({
	name: i18n.ts._miRoom._objects.aquarium,
	options: {},
});
