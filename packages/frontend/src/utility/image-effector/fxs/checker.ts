/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_checker = defineImageEffectorFx({
	id: 'checker' as const,
	name: i18n.ts._imageEffector._fxs.checker,
	shader: () => import('./checker.glsl?raw').then(m => m.default),
	uniforms: ['angle', 'scale', 'color', 'opacity'] as const,
	params: {
		angle: {
			type: 'number' as const,
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		scale: {
			type: 'number' as const,
			default: 3.0,
			min: 1.0,
			max: 10.0,
			step: 0.1,
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
		gl.uniform1f(u.scale, params.scale * params.scale);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.opacity, params.opacity);
	},
});
