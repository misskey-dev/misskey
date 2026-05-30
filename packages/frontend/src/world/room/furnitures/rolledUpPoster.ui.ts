/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineFurnitureUi } from '../defineFurnitureUi.js';
import type { rolledUpPoster_schema } from 'misskey-world/src/room/furnitures/rolledUpPoster.schema.js';
import { i18n } from '@/i18n.js';

export const rolledUpPoster_ui = defineFurnitureUi<typeof rolledUpPoster_schema>({
	name: i18n.ts._miRoom._objects.rolledUpPoster,
	options: {},
});
