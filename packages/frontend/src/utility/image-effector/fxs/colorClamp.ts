/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_max;
uniform float u_min;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float r = min(max(in_color.r, u_min), u_max);
	float g = min(max(in_color.g, u_min), u_max);
	float b = min(max(in_color.b, u_min), u_max);
	out_color = vec4(r, g, b, in_color.a);
}
`;

export const FX_colorClamp = defineImageEffectorFx({
	id: 'colorClamp' as const,
	name: i18n.ts._imageEffector._fxs.colorClamp,
	shader,
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
