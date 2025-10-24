/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './distort.glsl';
import { i18n } from '@/i18n.js';

export const FX_distort = defineImageEffectorFx({
	id: 'distort',
	name: i18n.ts._imageEffector._fxs.distort,
	shader,
	uniforms: ['phase', 'frequency', 'strength', 'direction'] as const,
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
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.phase, params.phase);
		gl.uniform1f(u.frequency, params.frequency);
		gl.uniform1f(u.strength, params.strength);
		gl.uniform1i(u.direction, params.direction);
	},
});
