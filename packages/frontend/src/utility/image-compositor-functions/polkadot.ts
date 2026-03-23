/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './polkadot.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	angle: number;
	scale: number;
	majorRadius: number;
	majorOpacity: number;
	minorDivisions: number;
	minorRadius: number;
	minorOpacity: number;
	color: [number, number, number];
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.scale, params.scale * params.scale);
		gl.uniform1f(u.major_radius, params.majorRadius);
		gl.uniform1f(u.major_opacity, params.majorOpacity);
		gl.uniform1f(u.minor_divisions, params.minorDivisions);
		gl.uniform1f(u.minor_radius, params.minorRadius);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.minor_opacity, params.minorOpacity);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.polkadot,
	params: {
		angle: {
			label: i18n.ts._imageEffector._fxProps.angle,
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		scale: {
			label: i18n.ts._imageEffector._fxProps.scale,
			type: 'number',
			default: 3.0,
			min: 1.0,
			max: 10.0,
			step: 0.1,
		},
		majorRadius: {
			label: i18n.ts._watermarkEditor.polkadotMainDotRadius,
			type: 'number',
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		majorOpacity: {
			label: i18n.ts._watermarkEditor.polkadotMainDotOpacity,
			type: 'number',
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		minorDivisions: {
			label: i18n.ts._watermarkEditor.polkadotSubDotDivisions,
			type: 'number',
			default: 4,
			min: 0,
			max: 16,
			step: 1,
		},
		minorRadius: {
			label: i18n.ts._watermarkEditor.polkadotSubDotRadius,
			type: 'number',
			default: 0.25,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		minorOpacity: {
			label: i18n.ts._watermarkEditor.polkadotSubDotOpacity,
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		color: {
			label: i18n.ts._imageEffector._fxProps.color,
			type: 'color',
			default: [1, 1, 1],
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
