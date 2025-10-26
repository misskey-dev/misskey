/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './mirror.glsl';
import { i18n } from '@/i18n.js';

export const FX_mirror = defineImageEffectorFx({
	id: 'mirror',
	name: i18n.ts._imageEffector._fxs.mirror,
	shader,
	uniforms: ['h', 'v'] as const,
	params: {
		h: {
			label: i18n.ts.horizontal,
			type: 'number:enum',
			enum: [
				{ value: -1 as const, icon: 'ti ti-arrow-bar-right' },
				{ value: 0 as const, icon: 'ti ti-minus-vertical' },
				{ value: 1 as const, icon: 'ti ti-arrow-bar-left' }
			],
			default: -1,
		},
		v: {
			label: i18n.ts.vertical,
			type: 'number:enum',
			enum: [
				{ value: -1 as const, icon: 'ti ti-arrow-bar-down' },
				{ value: 0 as const, icon: 'ti ti-minus' },
				{ value: 1 as const, icon: 'ti ti-arrow-bar-up' }
			],
			default: 0,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1i(u.h, params.h);
		gl.uniform1i(u.v, params.v);
	},
});
