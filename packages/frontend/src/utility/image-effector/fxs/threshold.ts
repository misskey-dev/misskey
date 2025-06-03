/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_threshold = defineImageEffectorFx({
	id: 'threshold' as const,
	name: i18n.ts._imageEffector._fxs.threshold,
	shader: () => import('./threshold.glsl?raw').then(m => m.default),
	uniforms: ['r', 'g', 'b'] as const,
	params: {
		r: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		g: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		b: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.r, params.r);
		gl.uniform1f(u.g, params.g);
		gl.uniform1f(u.b, params.b);
	},
});
