/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_phase;
uniform float u_frequency;
uniform float u_strength;
uniform int u_direction; // 0: vertical, 1: horizontal
out vec4 out_color;

void main() {
	float v = u_direction == 0 ?
		sin((HALF_PI + (u_phase * PI) - (u_frequency / 2.0)) + in_uv.y * u_frequency) * u_strength :
		sin((HALF_PI + (u_phase * PI) - (u_frequency / 2.0)) + in_uv.x * u_frequency) * u_strength;
	vec4 in_color = u_direction == 0 ?
		texture(in_texture, vec2(in_uv.x + v, in_uv.y)) :
		texture(in_texture, vec2(in_uv.x, in_uv.y + v));
	out_color = in_color;
}
`;

export const FX_distort = defineImageEffectorFx({
	id: 'distort' as const,
	name: i18n.ts._imageEffector._fxs.distort,
	shader,
	uniforms: ['phase', 'frequency', 'strength', 'direction'] as const,
	params: {
		direction: {
			type: 'number:enum' as const,
			enum: [{ value: 0, label: 'v' }, { value: 1, label: 'h' }],
			default: 1,
		},
		phase: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		frequency: {
			type: 'number' as const,
			default: 30,
			min: 0,
			max: 100,
			step: 0.1,
		},
		strength: {
			type: 'number' as const,
			default: 0.05,
			min: 0,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.phase, params.phase);
		gl.uniform1f(u.frequency, params.frequency);
		gl.uniform1f(u.strength, params.strength);
		gl.uniform1i(u.direction, params.direction);
	},
});
