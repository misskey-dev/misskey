/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_zoomLines = defineImageEffectorFx({
	id: 'zoomLines' as const,
	name: i18n.ts._imageEffector._fxs.zoomLines,
	shader: () => import('./zoomLines.glsl?raw').then(m => m.default),
	uniforms: ['pos', 'frequency', 'thresholdEnabled', 'threshold', 'maskSize', 'black'] as const,
	params: {
		x: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		y: {
			type: 'number' as const,
			default: 0.0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		frequency: {
			type: 'number' as const,
			default: 30.0,
			min: 1.0,
			max: 200.0,
			step: 0.1,
		},
		thresholdEnabled: {
			type: 'boolean' as const,
			default: true,
		},
		threshold: {
			type: 'number' as const,
			default: 0.2,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		maskSize: {
			type: 'number' as const,
			default: 0.5,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		black: {
			type: 'boolean' as const,
			default: false,
		},
	},
	main: ({ gl, u, params }) => {
		gl.uniform2f(u.pos, (1.0 + params.x) / 2.0, (1.0 + params.y) / 2.0);
		gl.uniform1f(u.frequency, params.frequency);
		gl.uniform1i(u.thresholdEnabled, params.thresholdEnabled ? 1 : 0);
		gl.uniform1f(u.threshold, params.threshold);
		gl.uniform1f(u.maskSize, params.maskSize);
		gl.uniform1i(u.black, params.black ? 1 : 0);
	},
});
