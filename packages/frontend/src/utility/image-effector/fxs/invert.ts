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
uniform bool u_r;
uniform bool u_g;
uniform bool u_b;
uniform bool u_a;
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture, in_uv);
	out_color.r = u_r ? 1.0 - in_color.r : in_color.r;
	out_color.g = u_g ? 1.0 - in_color.g : in_color.g;
	out_color.b = u_b ? 1.0 - in_color.b : in_color.b;
	out_color.a = u_a ? 1.0 - in_color.a : in_color.a;
}
`;

export const FX_invert = defineImageEffectorFx({
	id: 'invert' as const,
	name: i18n.ts._imageEffector._fxs.invert,
	shader,
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
		a: {
			type: 'boolean' as const,
			default: false,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_r = gl.getUniformLocation(program, 'u_r');
		gl.uniform1i(u_r, params.r ? 1 : 0);

		const u_g = gl.getUniformLocation(program, 'u_g');
		gl.uniform1i(u_g, params.g ? 1 : 0);

		const u_b = gl.getUniformLocation(program, 'u_b');
		gl.uniform1i(u_b, params.b ? 1 : 0);

		const u_a = gl.getUniformLocation(program, 'u_a');
		gl.uniform1i(u_a, params.a ? 1 : 0);
	},
});
