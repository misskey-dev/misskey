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
uniform vec2 u_offset;
uniform vec2 u_scale;
uniform bool u_ellipse;
uniform float u_angle;
uniform int u_samples;
uniform float u_strength;
out vec4 out_color;

// TODO: pixelateの中心を画像中心ではなく範囲の中心にする
// TODO: 画像のアスペクト比に関わらず各画素は正方形にする

void main() {
	if (u_strength <= 0.0) {
		out_color = texture(in_texture, in_uv);
		return;
	}

	float angle = -(u_angle * PI);
	vec2 centeredUv = in_uv - vec2(0.5, 0.5) - u_offset;
	vec2 rotatedUV = vec2(
		centeredUv.x * cos(angle) - centeredUv.y * sin(angle),
		centeredUv.x * sin(angle) + centeredUv.y * cos(angle)
	) + u_offset;

	bool isInside = false;
	if (u_ellipse) {
		vec2 norm = (rotatedUV - u_offset) / u_scale;
		isInside = dot(norm, norm) <= 1.0;
	} else {
		isInside = rotatedUV.x > u_offset.x - u_scale.x && rotatedUV.x < u_offset.x + u_scale.x && rotatedUV.y > u_offset.y - u_scale.y && rotatedUV.y < u_offset.y + u_scale.y;
	}

	if (!isInside) {
		out_color = texture(in_texture, in_uv);
		return;
	}

	float dx = u_strength / 1.0;
	float dy = u_strength / 1.0;
	vec2 new_uv = vec2(
		(dx * (floor((in_uv.x - 0.5 - (dx / 2.0)) / dx) + 0.5)),
		(dy * (floor((in_uv.y - 0.5 - (dy / 2.0)) / dy) + 0.5))
	) + vec2(0.5 + (dx / 2.0), 0.5 + (dy / 2.0));

	vec4 result = vec4(0.0);
	float totalSamples = 0.0;

	// TODO: より多くのサンプリング
	result += texture(in_texture, new_uv);
	totalSamples += 1.0;

	out_color = totalSamples > 0.0 ? result / totalSamples : texture(in_texture, in_uv);
}
`;

export const FX_pixelate = defineImageEffectorFx({
	id: 'pixelate',
	name: i18n.ts._imageEffector._fxs.pixelate,
	shader,
	uniforms: ['offset', 'scale', 'ellipse', 'angle', 'strength', 'samples'] as const,
	params: {
		offsetX: {
			label: i18n.ts._imageEffector._fxProps.offset + ' X',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		offsetY: {
			label: i18n.ts._imageEffector._fxProps.offset + ' Y',
			type: 'number',
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleX: {
			label: i18n.ts._imageEffector._fxProps.scale + ' W',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		scaleY: {
			label: i18n.ts._imageEffector._fxProps.scale + ' H',
			type: 'number',
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		ellipse: {
			label: i18n.ts._imageEffector._fxProps.circle,
			type: 'boolean',
			default: false,
		},
		angle: {
			label: i18n.ts._imageEffector._fxProps.angle,
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 90) + '°',
		},
		strength: {
			label: i18n.ts._imageEffector._fxProps.strength,
			type: 'number',
			default: 0.2,
			min: 0.0,
			max: 0.5,
			step: 0.01,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.offset, params.offsetX / 2, params.offsetY / 2);
		gl.uniform2f(u.scale, params.scaleX / 2, params.scaleY / 2);
		gl.uniform1i(u.ellipse, params.ellipse ? 1 : 0);
		gl.uniform1f(u.angle, params.angle / 2);
		gl.uniform1f(u.strength, params.strength * params.strength);
		gl.uniform1i(u.samples, 256);
	},
});
