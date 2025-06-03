/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_stripe = defineImageEffectorFx({
	id: 'stripe' as const,
	name: i18n.ts._imageEffector._fxs.stripe,
	shader: () => import('./stripe.glsl?raw').then(m => m.default),
	uniforms: ['angle', 'frequency', 'phase', 'threshold', 'color', 'opacity'] as const,
	params: {
		angle: {
			type: 'number' as const,
			default: 0.5,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 10.0,
			min: 1.0,
			max: 30.0,
			step: 0.1,
		},
		threshold: {
			type: 'number' as const,
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		color: {
			type: 'color' as const,
			default: [1, 1, 1],
		},
		opacity: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		gl.uniform1f(u.phase, 0.0);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.opacity, params.opacity);
	},
});
