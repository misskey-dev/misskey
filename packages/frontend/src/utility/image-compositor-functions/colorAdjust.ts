/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './colorAdjust.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	lightness: number;
	contrast: number;
	hue: number;
	brightness: number;
	saturation: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.brightness, params.brightness);
		gl.uniform1f(u.contrast, params.contrast);
		gl.uniform1f(u.hue, params.hue / 2);
		gl.uniform1f(u.lightness, params.lightness);
		gl.uniform1f(u.saturation, params.saturation);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.colorAdjust,
	params: {
		lightness: {
			label: i18n.ts._imageEffector._fxProps.lightness,
			type: 'number',
			default: 0,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		contrast: {
			label: i18n.ts._imageEffector._fxProps.contrast,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		hue: {
			label: i18n.ts._imageEffector._fxProps.hue,
			type: 'number',
			default: 0,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 180) + '°',
		},
		brightness: {
			label: i18n.ts._imageEffector._fxProps.brightness,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		saturation: {
			label: i18n.ts._imageEffector._fxProps.saturation,
			type: 'number',
			default: 1,
			min: 0,
			max: 4,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
