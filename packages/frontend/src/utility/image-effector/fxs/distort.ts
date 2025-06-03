/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_distort = defineImageEffectorFx({
	id: 'distort' as const,
	name: i18n.ts._imageEffector._fxs.distort,
	shader: () => import('./distort.glsl?raw').then(m => m.default),
	uniforms: ['phase', 'frequency', 'strength', 'direction'] as const,
	params: {
		direction: {
			type: 'number:enum' as const,
			enum: [{ value: 0, label: 'v' }, { value: 1, label: 'h' }],
			default: 0,
		},
		phase: {
			type: 'number' as const,
			default: 50.0,
			min: 0.0,
			max: 100,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 50,
			min: 0,
			max: 100,
			step: 0.1,
		},
		strength: {
			type: 'number' as const,
			default: 0.1,
			min: 0,
			max: 1,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.phase, params.phase / 10);
		gl.uniform1f(u.frequency, params.frequency);
		gl.uniform1f(u.strength, params.strength);
		gl.uniform1i(u.direction, params.direction);
	},
});
