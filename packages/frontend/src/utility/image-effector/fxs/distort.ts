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
uniform float u_phase;
uniform float u_frequency;
uniform float u_strength;
uniform int u_direction; // 0: vertical, 1: horizontal
out vec4 out_color;

void main() {
	float v = u_direction == 0 ?
		sin(u_phase + in_uv.y * u_frequency) * u_strength :
		sin(u_phase + in_uv.x * u_frequency) * u_strength;
	vec4 in_color = u_direction == 0 ?
		texture(u_texture, vec2(in_uv.x + v, in_uv.y)) :
		texture(u_texture, vec2(in_uv.x, in_uv.y + v));
	out_color = in_color;
}
`;

export const FX_distort = defineImageEffectorFx({
	id: 'distort' as const,
	name: i18n.ts._imageEffector._fxs.distort,
	shader,
	params: {
		direction: {
			type: 'number:enum' as const,
			enum: [{ value: 0, label: 'v' }, { value: 1, label: 'h' }],
			default: 0,
		},
		phase: {
			type: 'number' as const,
			default: 50.0,
			min: 0.0,
			max: 100,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 50,
			min: 0,
			max: 100,
			step: 0.1,
		},
		strength: {
			type: 'number' as const,
			default: 0.1,
			min: 0,
			max: 1,
			step: 0.01,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_phase = gl.getUniformLocation(program, 'u_phase');
		gl.uniform1f(u_phase, params.phase / 10);

		const u_frequency = gl.getUniformLocation(program, 'u_frequency');
		gl.uniform1f(u_frequency, params.frequency);

		const u_strength = gl.getUniformLocation(program, 'u_strength');
		gl.uniform1f(u_strength, params.strength);

		const u_direction = gl.getUniformLocation(program, 'u_direction');
		gl.uniform1i(u_direction, params.direction);
	},
});
