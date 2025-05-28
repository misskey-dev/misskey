/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import seedrandom from 'seedrandom';
import { defineImageEffectorFx } from '../ImageEffector.js';

const shader = `#version 300 es
precision highp float;

in vec2 in_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
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

	float r = texture(u_texture, vec2(in_uv.x + (v * (1.0 + u_channelShift)), in_uv.y)).r;
	float g = texture(u_texture, vec2(in_uv.x + v, in_uv.y)).g;
	float b = texture(u_texture, vec2(in_uv.x + (v * (1.0 + (u_channelShift / 2.0))), in_uv.y)).b;
	float a = texture(u_texture, vec2(in_uv.x + v, in_uv.y)).a;
	out_color = vec4(r, g, b, a);
}
`;

export const FX_glitch = defineImageEffectorFx({
	id: 'glitch' as const,
	shader,
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
			default: 5,
			min: -100,
			max: 100,
			step: 0.01,
		},
		size: {
			type: 'number' as const,
			default: 20,
			min: 0,
			max: 100,
			step: 0.01,
		},
		channelShift: {
			type: 'number' as const,
			default: 0.5,
			min: 0,
			max: 10,
			step: 0.01,
		},
		seed: {
			type: 'seed' as const,
			default: 100,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_amount = gl.getUniformLocation(program, 'u_amount');
		gl.uniform1i(u_amount, params.amount);

		const u_channelShift = gl.getUniformLocation(program, 'u_channelShift');
		gl.uniform1f(u_channelShift, params.channelShift);

		const rnd = seedrandom(params.seed.toString());

		for (let i = 0; i < params.amount; i++) {
			const o = gl.getUniformLocation(program, `u_shiftOrigins[${i.toString()}]`);
			gl.uniform1f(o, rnd());

			const s = gl.getUniformLocation(program, `u_shiftStrengths[${i.toString()}]`);
			gl.uniform1f(s, (1 - (rnd() * 2)) * (params.strength / 100));

			const h = gl.getUniformLocation(program, `u_shiftHeights[${i.toString()}]`);
			gl.uniform1f(h, rnd() * (params.size / 100));
		}
	},
});
