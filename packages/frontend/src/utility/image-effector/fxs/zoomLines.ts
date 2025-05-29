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
uniform vec2 u_pos;
uniform float frequency;
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture, in_uv);
	float t = atan(u_pos.y + (in_uv.y - 0.5), u_pos.x + (in_uv.x - 0.5));
	t = sin(t * frequency);
	out_color = vec4(
		mix(in_color.r, 1.0, t),
		mix(in_color.g, 1.0, t),
		mix(in_color.b, 1.0, t),
		in_color.a
	);
}
`;

export const FX_zoomLines = defineImageEffectorFx({
	id: 'zoomLines' as const,
	name: i18n.ts._imageEffector._fxs.zoomLines,
	shader,
	params: {
		x: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		y: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 30.0,
			min: 1.0,
			max: 200.0,
			step: 0.1,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_pos = gl.getUniformLocation(program, 'u_pos');
		gl.uniform2f(u_pos, -(params.x / 2.0), -(params.y / 2.0));

		const u_frequency = gl.getUniformLocation(program, 'frequency');
		gl.uniform1f(u_frequency, params.frequency);
	},
});
