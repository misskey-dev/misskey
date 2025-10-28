/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './invert.glsl';
import { i18n } from '@/i18n.js';

export const FX_invert = defineImageEffectorFx({
	id: 'invert',
	name: i18n.ts._imageEffector._fxs.invert,
	shader,
	uniforms: ['r', 'g', 'b'] as const,
	params: {
		r: {
			label: i18n.ts._imageEffector._fxProps.redComponent,
			type: 'boolean',
			default: true,
		},
		g: {
			label: i18n.ts._imageEffector._fxProps.greenComponent,
			type: 'boolean',
			default: true,
		},
		b: {
			label: i18n.ts._imageEffector._fxProps.blueComponent,
			type: 'boolean',
			default: true,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.r, params.r ? 1 : 0);
		gl.uniform1i(u.g, params.g ? 1 : 0);
		gl.uniform1i(u.b, params.b ? 1 : 0);
	},
});
