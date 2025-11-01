/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import shader from './colorClamp.glsl';
import { i18n } from '@/i18n.js';

export const FX_colorClamp = defineImageEffectorFx({
	id: 'colorClamp',
	name: i18n.ts._imageEffector._fxs.colorClamp,
	shader,
	uniforms: ['rMax', 'rMin', 'gMax', 'gMin', 'bMax', 'bMin'] as const,
	params: {
		max: {
			label: i18n.ts._imageEffector._fxProps.max,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		min: {
			label: i18n.ts._imageEffector._fxProps.min,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.rMax, params.max);
		gl.uniform1f(u.rMin, 1.0 + params.min);
		gl.uniform1f(u.gMax, params.max);
		gl.uniform1f(u.gMin, 1.0 + params.min);
		gl.uniform1f(u.bMax, params.max);
		gl.uniform1f(u.bMin, 1.0 + params.min);
	},
});
