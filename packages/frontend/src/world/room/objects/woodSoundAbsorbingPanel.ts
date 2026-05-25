/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../object.js';
import { i18n } from '@/i18n.js';

export const woodSoundAbsorbingPanel = defineObject({
	id: 'woodSoundAbsorbingPanel',
	name: i18n.ts._miRoom._objects.woodSoundAbsorbingPanel,
	options: {
		schema: {},
		default: {},
	},
	placement: 'side',
	hasCollisions: false,
	createInstance: () => {
		return {
			interactions: {},
			dispose: () => {},
		};
	},
});
