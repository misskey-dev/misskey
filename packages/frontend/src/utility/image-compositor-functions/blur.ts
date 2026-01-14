/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './blur.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	offsetX: number;
	offsetY: number;
	scaleX: number;
	scaleY: number;
	ellipse: boolean;
	angle: number;
	radius: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.offset, params.offsetX / 2, params.offsetY / 2);
		gl.uniform2f(u.scale, params.scaleX / 2, params.scaleY / 2);
		gl.uniform1i(u.ellipse, params.ellipse ? 1 : 0);
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.radius, params.radius);
		gl.uniform1i(u.samples, 256);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.blur,
	params: {
		offsetX: {
			label: i18n.ts._imageEffector._fxProps.offset + ' X',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		offsetY: {
			label: i18n.ts._imageEffector._fxProps.offset + ' Y',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleX: {
			label: i18n.ts._imageEffector._fxProps.scale + ' W',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleY: {
			label: i18n.ts._imageEffector._fxProps.scale + ' H',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		ellipse: {
			label: i18n.ts._imageEffector._fxProps.circle,
			type: 'boolean',
			default: false,
		},
		angle: {
			label: i18n.ts._imageEffector._fxProps.angle,
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		radius: {
			label: i18n.ts._imageEffector._fxProps.strength,
			type: 'number',
			default: 3.0,
			min: 0.0,
			max: 10.0,
			step: 0.5,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
