/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_polkadot = defineImageEffectorFx({
	id: 'polkadot' as const,
	name: i18n.ts._imageEffector._fxs.polkadot,
	shader: () => import('./polkadot.glsl?raw').then(m => m.default),
	uniforms: ['angle', 'scale', 'major_radius', 'major_opacity', 'minor_divisions', 'minor_radius', 'minor_opacity', 'color'] as const,
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
		majorRadius: {
			type: 'number' as const,
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		majorOpacity: {
			type: 'number' as const,
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		minorDivisions: {
			type: 'number' as const,
			default: 4,
			min: 0,
			max: 16,
			step: 1,
		},
		minorRadius: {
			type: 'number' as const,
			default: 0.25,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		minorOpacity: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		color: {
			type: 'color' as const,
			default: [1, 1, 1],
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.scale, params.scale * params.scale);
		gl.uniform1f(u.major_radius, params.majorRadius);
		gl.uniform1f(u.major_opacity, params.majorOpacity);
		gl.uniform1f(u.minor_divisions, params.minorDivisions);
		gl.uniform1f(u.minor_radius, params.minorRadius);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.minor_opacity, params.minorOpacity);
	},
});
