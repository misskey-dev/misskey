/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './colorClamp.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	max: number;
	min: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.rMax, params.max);
		gl.uniform1f(u.rMin, 1.0 + params.min);
		gl.uniform1f(u.gMax, params.max);
		gl.uniform1f(u.gMin, 1.0 + params.min);
		gl.uniform1f(u.bMax, params.max);
		gl.uniform1f(u.bMin, 1.0 + params.min);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.colorClamp,
	params: {
		max: {
			label: i18n.ts._imageEffector._fxProps.max,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		min: {
			label: i18n.ts._imageEffector._fxProps.min,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
