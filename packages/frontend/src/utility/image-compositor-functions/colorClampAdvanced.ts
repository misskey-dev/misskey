/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './colorClamp.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	rMax: number;
	rMin: number;
	gMax: number;
	gMin: number;
	bMax: number;
	bMin: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.rMax, params.rMax);
		gl.uniform1f(u.rMin, 1.0 + params.rMin);
		gl.uniform1f(u.gMax, params.gMax);
		gl.uniform1f(u.gMin, 1.0 + params.gMin);
		gl.uniform1f(u.bMax, params.bMax);
		gl.uniform1f(u.bMin, 1.0 + params.bMin);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.colorClampAdvanced,
	params: {
		rMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.redComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		rMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.redComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		gMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.greenComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		gMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.greenComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		bMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.blueComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		bMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.blueComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
