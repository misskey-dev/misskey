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
uniform float u_angle;
uniform float u_frequency;
uniform float u_phase;
uniform float u_threshold;
uniform vec3 u_color;
uniform float u_opacity;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float x_ratio = max(in_resolution.x / in_resolution.y, 1.0);
	float y_ratio = max(in_resolution.y / in_resolution.x, 1.0);

	float angle = -(u_angle * PI);
	vec2 centeredUv = (in_uv - vec2(0.5, 0.5)) * vec2(x_ratio, y_ratio);
	vec2 rotatedUV = vec2(
		centeredUv.x * cos(angle) - centeredUv.y * sin(angle),
		centeredUv.x * sin(angle) + centeredUv.y * cos(angle)
	);

	float phase = u_phase * TWO_PI;
	float value = (1.0 + sin((rotatedUV.x * u_frequency - HALF_PI) + phase)) / 2.0;
	value = value < u_threshold ? 1.0 : 0.0;
	out_color = vec4(
		mix(in_color.r, u_color.r, value * u_opacity),
		mix(in_color.g, u_color.g, value * u_opacity),
		mix(in_color.b, u_color.b, value * u_opacity),
		in_color.a
	);
}
`;

export const FX_stripe = defineImageEffectorFx({
	id: 'stripe' as const,
	name: i18n.ts._imageEffector._fxs.stripe,
	shader,
	uniforms: ['angle', 'frequency', 'phase', 'threshold', 'color', 'opacity'] as const,
	params: {
		angle: {
			type: 'number' as const,
			default: 0.5,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		frequency: {
			type: 'number' as const,
			default: 10.0,
			min: 1.0,
			max: 30.0,
			step: 0.1,
		},
		threshold: {
			type: 'number' as const,
			default: 0.1,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		color: {
			type: 'color' as const,
			default: [1, 1, 1],
		},
		opacity: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.frequency, params.frequency * params.frequency);
		gl.uniform1f(u.phase, 0.0);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform3f(u.color, params.color[0], params.color[1], params.color[2]);
		gl.uniform1f(u.opacity, params.opacity);
	},
});
