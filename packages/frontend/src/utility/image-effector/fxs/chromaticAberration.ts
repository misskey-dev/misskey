/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_chromaticAberration = defineImageEffectorFx({
	id: 'chromaticAberration' as const,
	name: i18n.ts._imageEffector._fxs.chromaticAberration,
	shader: () => import('./chromaticAberration.glsl?raw').then(m => m.default),
	uniforms: ['amount', 'start', 'normalize'] as const,
	params: {
		normalize: {
			type: 'boolean' as const,
			default: false,
		},
		amount: {
			type: 'number' as const,
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.amount, params.amount);
		gl.uniform1i(u.normalize, params.normalize ? 1 : 0);
	},
});
