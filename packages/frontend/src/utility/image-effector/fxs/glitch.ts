/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import seedrandom from 'seedrandom';
import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_glitch = defineImageEffectorFx({
	id: 'glitch' as const,
	name: i18n.ts._imageEffector._fxs.glitch,
	shader: () => import('./glitch.glsl?raw').then(m => m.default),
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
	main: ({ gl, program, u, params }) => {
		gl.uniform1i(u.amount, params.amount);
		gl.uniform1f(u.channelShift, params.channelShift);

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
