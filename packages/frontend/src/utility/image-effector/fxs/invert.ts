/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_invert = defineImageEffectorFx({
	id: 'invert' as const,
	name: i18n.ts._imageEffector._fxs.invert,
	shader: () => import('./invert.glsl?raw').then(m => m.default),
	uniforms: ['r', 'g', 'b'] as const,
	params: {
		r: {
			type: 'boolean' as const,
			default: true,
		},
		g: {
			type: 'boolean' as const,
			default: true,
		},
		b: {
			type: 'boolean' as const,
			default: true,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.r, params.r ? 1 : 0);
		gl.uniform1i(u.g, params.g ? 1 : 0);
		gl.uniform1i(u.b, params.b ? 1 : 0);
	},
});
