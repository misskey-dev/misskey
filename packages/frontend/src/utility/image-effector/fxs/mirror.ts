/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_mirror = defineImageEffectorFx({
	id: 'mirror' as const,
	name: i18n.ts._imageEffector._fxs.mirror,
	shader: () => import('./mirror.glsl?raw').then(m => m.default),
	uniforms: ['h', 'v'] as const,
	params: {
		h: {
			type: 'number:enum' as const,
			enum: [{ value: -1, label: '<-' }, { value: 0, label: '|' }, { value: 1, label: '->' }],
			default: -1,
		},
		v: {
			type: 'number:enum' as const,
			enum: [{ value: -1, label: '^' }, { value: 0, label: '-' }, { value: 1, label: 'v' }],
			default: 0,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.h, params.h);
		gl.uniform1i(u.v, params.v);
	},
});
