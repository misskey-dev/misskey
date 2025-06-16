/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import seedrandom from 'seedrandom';
import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform int u_amount;
uniform float u_shiftStrengths[128];
uniform float u_shiftOrigins[128];
uniform float u_shiftHeights[128];
uniform float u_channelShift;
out vec4 out_color;

void main() {
	float v = 0.0;

	for (int i = 0; i < u_amount; i++) {
		if (in_uv.y > (u_shiftOrigins[i] - u_shiftHeights[i]) && in_uv.y < (u_shiftOrigins[i] + u_shiftHeights[i])) {
			v += u_shiftStrengths[i];
		}
	}

	float r = texture(in_texture, vec2(in_uv.x + (v * (1.0 + u_channelShift)), in_uv.y)).r;
	float g = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).g;
	float b = texture(in_texture, vec2(in_uv.x + (v * (1.0 + (u_channelShift / 2.0))), in_uv.y)).b;
	float a = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).a;
	out_color = vec4(r, g, b, a);
}
`;

export const FX_tearing = defineImageEffectorFx({
	id: 'tearing' as const,
	name: i18n.ts._imageEffector._fxs.glitch + ': ' + i18n.ts._imageEffector._fxs.tearing,
	shader,
	uniforms: ['amount', 'channelShift'] as const,
	params: {
		amount: {
			type: 'number' as const,
			default: 3,
			min: 1,
			max: 100,
			step: 1,
		},
		strength: {
			type: 'number' as const,
			default: 0.05,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		size: {
			type: 'number' as const,
			default: 0.2,
			min: 0,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		channelShift: {
			type: 'number' as const,
			default: 0.5,
			min: 0,
			max: 10,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		seed: {
			type: 'seed' as const,
			default: 100,
		},
	},
	main: ({ gl, program, u, params }) => {
		gl.uniform1i(u.amount, params.amount);
		gl.uniform1f(u.channelShift, params.channelShift);

		const rnd = seedrandom(params.seed.toString());

		for (let i = 0; i < params.amount; i++) {
			const o = gl.getUniformLocation(program, `u_shiftOrigins[${i.toString()}]`);
			gl.uniform1f(o, rnd());

			const s = gl.getUniformLocation(program, `u_shiftStrengths[${i.toString()}]`);
			gl.uniform1f(s, (1 - (rnd() * 2)) * params.strength);

			const h = gl.getUniformLocation(program, `u_shiftHeights[${i.toString()}]`);
			gl.uniform1f(h, rnd() * params.size);
		}
	},
});
