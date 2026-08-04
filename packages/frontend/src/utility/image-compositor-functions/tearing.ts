/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import seedrandom from 'seedrandom';
import shader from './tearing.glsl';
import type { ImageEffectorUiDefinition } from '../image-effector/ImageEffector.js';
import { defineImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { i18n } from '@/i18n.js';

export const fn = defineImageCompositorFunction<{
	amount: number;
	strength: number;
	size: number;
	channelShift: number;
	seed: number;
}>({
	shader,
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

export const uiDefinition = {
	name: i18n.ts._imageEffector._fxs.glitch + ': ' + i18n.ts._imageEffector._fxs.tearing,
	params: {
		amount: {
			label: i18n.ts._imageEffector._fxProps.amount,
			type: 'number',
			default: 3,
			min: 1,
			max: 100,
			step: 1,
		},
		strength: {
			label: i18n.ts._imageEffector._fxProps.strength,
			type: 'number',
			default: 0.05,
			min: -1,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		size: {
			label: i18n.ts._imageEffector._fxProps.size,
			type: 'number',
			default: 0.2,
			min: 0,
			max: 1,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		channelShift: {
			label: i18n.ts._imageEffector._fxProps.glitchChannelShift,
			type: 'number',
			default: 0.5,
			min: 0,
			max: 10,
			step: 0.01,
			toViewValue: v => Math.round(v * 100) + '%',
		},
		seed: {
			label: i18n.ts._imageEffector._fxProps.seed,
			type: 'seed',
			default: 100,
		},
	},
} satisfies ImageEffectorUiDefinition<typeof fn>;
