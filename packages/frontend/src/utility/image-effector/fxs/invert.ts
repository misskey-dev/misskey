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
uniform bool u_r;
uniform bool u_g;
uniform bool u_b;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	out_color.r = u_r ? 1.0 - in_color.r : in_color.r;
	out_color.g = u_g ? 1.0 - in_color.g : in_color.g;
	out_color.b = u_b ? 1.0 - in_color.b : in_color.b;
	out_color.a = in_color.a;
}
`;

export const FX_invert = defineImageEffectorFx({
	id: 'invert' as const,
	name: i18n.ts._imageEffector._fxs.invert,
	shader,
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
