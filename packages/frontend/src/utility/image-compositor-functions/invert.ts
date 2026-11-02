/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './invert.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	r: boolean;
	g: boolean;
	b: boolean;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.r, params.r ? 1 : 0);
		gl.uniform1i(u.g, params.g ? 1 : 0);
		gl.uniform1i(u.b, params.b ? 1 : 0);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.invert,
	params: {
		r: {
			label: i18n.ts._imageEffector._fxProps.redComponent,
			type: 'boolean',
			default: true,
		},
		g: {
			label: i18n.ts._imageEffector._fxProps.greenComponent,
			type: 'boolean',
			default: true,
		},
		b: {
			label: i18n.ts._imageEffector._fxProps.blueComponent,
			type: 'boolean',
			default: true,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
