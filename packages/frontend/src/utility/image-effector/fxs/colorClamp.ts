/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_colorClamp = defineImageEffectorFx({
	id: 'colorClamp' as const,
	name: i18n.ts._imageEffector._fxs.colorClamp,
	shader: () => import('./colorClamp.glsl?raw').then(m => m.default),
	uniforms: ['max', 'min'] as const,
	params: {
		max: {
			type: 'number' as const,
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		min: {
			type: 'number' as const,
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.max, params.max);
		gl.uniform1f(u.min, 1.0 + params.min);
	},
});
