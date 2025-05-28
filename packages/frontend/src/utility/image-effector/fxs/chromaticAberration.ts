/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision highp float;

in vec2 in_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
out vec4 out_color;
uniform float u_amount;
uniform float u_start;
uniform bool u_normalize;

void main() {
	int samples = 64;
	float r_strength = 1.0;
	float g_strength = 1.5;
	float b_strength = 2.0;

	vec2 size = vec2(u_resolution.x, u_resolution.y);

	vec4 accumulator = vec4(0.0);
	float normalisedValue = length((in_uv - 0.5) * 2.0);
	float strength = clamp((normalisedValue - u_start) * (1.0 / (1.0 - u_start)), 0.0, 1.0);

	vec2 vector = (u_normalize ? normalize(in_uv - vec2(0.5)) : in_uv - vec2(0.5));
	vec2 velocity = vector * strength * u_amount;

	vec2 rOffset = -vector * strength * (u_amount * r_strength);
	vec2 gOffset = -vector * strength * (u_amount * g_strength);
	vec2 bOffset = -vector * strength * (u_amount * b_strength);

	for (int i = 0; i < samples; i++) {
		accumulator.r += texture(u_texture, in_uv + rOffset).r;
		rOffset -= velocity / float(samples);

		accumulator.g += texture(u_texture, in_uv + gOffset).g;
		gOffset -= velocity / float(samples);

		accumulator.b += texture(u_texture, in_uv + bOffset).b;
		bOffset -= velocity / float(samples);
	}

	out_color = vec4(vec3(accumulator / float(samples)), 1.0);
}
`;

export const FX_chromaticAberration = defineImageEffectorFx({
	id: 'chromaticAberration' as const,
	name: i18n.ts._imageEffector._fxs.chromaticAberration,
	shader,
	params: {
		normalize: {
			type: 'boolean' as const,
			default: false,
		},
		amount: {
			type: 'number' as const,
			default: 0.1,
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

		const u_amount = gl.getUniformLocation(program, 'u_amount');
		gl.uniform1f(u_amount, params.amount);

		const u_normalize = gl.getUniformLocation(program, 'u_normalize');
		gl.uniform1i(u_normalize, params.normalize ? 1 : 0);
	},
});
