/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_r;
uniform float u_g;
uniform float u_b;
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture, in_uv);
	float r = in_color.r < u_r ? 0.0 : 1.0;
	float g = in_color.g < u_g ? 0.0 : 1.0;
	float b = in_color.b < u_b ? 0.0 : 1.0;
	out_color = vec4(r, g, b, in_color.a);
}
`;

export const FX_threshold = defineImageEffectorFx({
	id: 'threshold' as const,
	name: i18n.ts._imageEffector._fxs.threshold,
	shader,
	params: {
		r: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		g: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		b: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_r = gl.getUniformLocation(program, 'u_r');
		gl.uniform1f(u_r, params.r);

		const u_g = gl.getUniformLocation(program, 'u_g');
		gl.uniform1f(u_g, params.g);

		const u_b = gl.getUniformLocation(program, 'u_b');
		gl.uniform1f(u_b, params.b);
	},
});
