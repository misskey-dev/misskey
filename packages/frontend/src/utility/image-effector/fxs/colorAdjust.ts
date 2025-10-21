/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './colorAdjust.glsl';
import { i18n } from '@/i18n.js';

export const FX_colorAdjust = defineImageEffectorFx({
	id: 'colorAdjust',
	name: i18n.ts._imageEffector._fxs.colorAdjust,
	shader,
	uniforms: ['lightness', 'contrast', 'hue', 'brightness', 'saturation'] as const,
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
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.brightness, params.brightness);
		gl.uniform1f(u.contrast, params.contrast);
		gl.uniform1f(u.hue, params.hue / 2);
		gl.uniform1f(u.lightness, params.lightness);
		gl.uniform1f(u.saturation, params.saturation);
	},
});
