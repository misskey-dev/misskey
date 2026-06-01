/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { aquarium_schema } from 'misskey-world/src/room/furnitures/aquarium.schema.js';
import { i18n } from '@/i18n.js';

export const aquarium_ui = defineFurnitureUi<typeof aquarium_schema>({
	name: i18n.ts._miRoom._furnitures.aquarium,
	options: {},
});
