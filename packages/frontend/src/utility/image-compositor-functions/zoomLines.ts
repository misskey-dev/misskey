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
	smoothing: boolean;
	threshold: number;
	maskSize: number;
	black: boolean;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.pos, params.x / 2, params.y / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		// thresholdの調整が有効な間はsmoothingが利用できない
		gl.uniform1i(u.thresholdEnabled, params.smoothing ? 0 : 1);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform1f(u.maskSize, params.maskSize);
		gl.uniform1i(u.black, params.black ? 1 : 0);
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
		smoothing: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesSmoothing,
			caption: i18n.ts._imageEffector._fxProps.zoomLinesSmoothingDescription,
			type: 'boolean',
			default: false,
		},
		threshold: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesThreshold,
			type: 'number',
			default: 0.5,
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
		black: {
			label: i18n.ts._imageEffector._fxProps.zoomLinesBlack,
			type: 'boolean',
			default: false,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
