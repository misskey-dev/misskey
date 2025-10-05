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
uniform float u_rMax;
uniform float u_rMin;
uniform float u_gMax;
uniform float u_gMin;
uniform float u_bMax;
uniform float u_bMin;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float r = min(max(in_color.r, u_rMin), u_rMax);
	float g = min(max(in_color.g, u_gMin), u_gMax);
	float b = min(max(in_color.b, u_bMin), u_bMax);
	out_color = vec4(r, g, b, in_color.a);
}
`;

export const FX_colorClampAdvanced = defineImageEffectorFx({
	id: 'colorClampAdvanced',
	name: i18n.ts._imageEffector._fxs.colorClampAdvanced,
	shader,
	uniforms: ['rMax', 'rMin', 'gMax', 'gMin', 'bMax', 'bMin'] as const,
	params: {
		rMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.redComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		rMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.redComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		gMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.greenComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		gMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.greenComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		bMax: {
			label: `${i18n.ts._imageEffector._fxProps.max} (${i18n.ts._imageEffector._fxProps.blueComponent})`,
			type: 'number',
			default: 1.0,
			min: 0.0,
			max: 1.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		bMin: {
			label: `${i18n.ts._imageEffector._fxProps.min} (${i18n.ts._imageEffector._fxProps.blueComponent})`,
			type: 'number',
			default: -1.0,
			min: -1.0,
			max: 0.0,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform1f(u.rMax, params.rMax);
		gl.uniform1f(u.rMin, 1.0 + params.rMin);
		gl.uniform1f(u.gMax, params.gMax);
		gl.uniform1f(u.gMin, 1.0 + params.gMin);
		gl.uniform1f(u.bMax, params.bMax);
		gl.uniform1f(u.bMin, 1.0 + params.bMin);
	},
});
