/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFunitureUi } from '../defineFunitureUi.js';
import type { aquarium_schema } from 'misskey-world/src/room/objects/aquarium.schema.js';
import { i18n } from '@/i18n.js';

export const aquarium_ui = defineFunitureUi<typeof aquarium_schema>({
	name: i18n.ts._miRoom._objects.aquarium,
	options: {},
});
