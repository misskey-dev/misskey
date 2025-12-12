/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import shader from './grayscale.glsl';

export const fn = defineImageCompositorFunction({
	shader,
	main: ({ gl, u, params }) => {
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.grayscale,
	params: {
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
