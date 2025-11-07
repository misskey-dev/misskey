/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './threshold.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	r: number;
	g: number;
	b: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.r, params.r);
		gl.uniform1f(u.g, params.g);
		gl.uniform1f(u.b, params.b);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.threshold,
	params: {
		r: {
			label: i18n.ts._imageEffector._fxProps.redComponent,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		g: {
			label: i18n.ts._imageEffector._fxProps.greenComponent,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		b: {
			label: i18n.ts._imageEffector._fxProps.blueComponent,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
