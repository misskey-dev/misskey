/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { cuboid } from './cuboid.js';
import { i18n } from '@/i18n.js';

export const cuboid_ui = defineObjectUi<typeof cuboid>({
	name: i18n.ts._miRoom._objects.cuboid,
	options: {
		x: {
			label: i18n.ts._miRoom._objects._cuboid.x,
		},
		y: {
			label: i18n.ts._miRoom._objects._cuboid.y,
		},
		z: {
			label: i18n.ts._miRoom._objects._cuboid.z,
		},
		mat: {
			label: i18n.ts._miRoom._objects._cuboid.mat,
		},
	},
});
