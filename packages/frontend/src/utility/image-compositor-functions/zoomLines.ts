/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './zoomLines.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	x: number;
	y: number;
	frequency: number;
	density: number;
	outlineThickness: number;
	maskSize: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.pos, params.x / 2, params.y / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		gl.uniform1f(u.threshold, 1.0 - params.density);
		gl.uniform1f(u.outlineThickness, params.outlineThickness);
		gl.uniform1f(u.maskSize, params.maskSize);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.zoomLines,
	params: {
		x: {
			label: i18n.ts._imageEffector._fxProps.centerX,
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		y: {
			label: i18n.ts._imageEffector._fxProps.centerY,
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			label: i18n.ts._imageEffector._fxProps.frequency,
			type: 'number',
			default: 5.0,
			min: 0.0,
			max: 15.0,
			step: 0.1,
		},
		density: {
			label: i18n.ts._imageEffector._fxProps.density,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		outlineThickness: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesOutlineThickness,
			type: 'number',
			default: 0.25,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		maskSize: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesMaskSize,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
