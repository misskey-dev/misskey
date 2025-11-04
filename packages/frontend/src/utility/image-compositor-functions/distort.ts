/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import shader from './distort.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	direction: number;
	phase: number;
	frequency: number;
	strength: number;
}>({
	shader,
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.phase, params.phase);
		gl.uniform1f(u.frequency, params.frequency);
		gl.uniform1f(u.strength, params.strength);
		gl.uniform1i(u.direction, params.direction);
	},
});

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.distort,
	params: {
		direction: {
			label: i18n.ts._imageEffector._fxProps.direction,
			type: 'number:enum',
			enum: [
				{ value: 0 as const, label: i18n.ts.horizontal },
				{ value: 1 as const, label: i18n.ts.vertical },
			],
			default: 1,
		},
		phase: {
			label: i18n.ts._imageEffector._fxProps.phase,
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		frequency: {
			label: i18n.ts._imageEffector._fxProps.frequency,
			type: 'number',
			default: 30,
			min: 0,
			max: 100,
			step: 0.1,
		},
		strength: {
			label: i18n.ts._imageEffector._fxProps.strength,
			type: 'number',
			default: 0.05,
			min: 0,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
