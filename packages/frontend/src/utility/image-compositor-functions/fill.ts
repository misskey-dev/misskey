/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './fill.glsl';
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
	color: [number, number, number];
	opacity: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.offset, params.offsetX / 2, params.offsetY / 2);
		gl.uniform2f(u.scale, params.scaleX / 2, params.scaleY / 2);
		gl.uniform1i(u.ellipse, params.ellipse ? 1 : 0);
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.opacity, params.opacity);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.fill,
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
		color: {
			label: i18n.ts._imageEffector._fxProps.color,
			type: 'color',
			default: [1, 1, 1],
		},
		opacity: {
			label: i18n.ts._imageEffector._fxProps.opacity,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
