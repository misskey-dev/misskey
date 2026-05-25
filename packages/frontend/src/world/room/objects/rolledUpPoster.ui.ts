/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { rolledUpPoster } from './rolledUpPoster.js';
import { i18n } from '@/i18n.js';

export const rolledUpPoster_ui = defineObjectUi<typeof rolledUpPoster>({
	name: i18n.ts._miRoom._objects.rolledUpPoster,
	options: {},
});
