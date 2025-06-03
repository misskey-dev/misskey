/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

export const FX_grayscale = defineImageEffectorFx({
	id: 'grayscale' as const,
	name: i18n.ts._imageEffector._fxs.grayscale,
	shader: () => import('./grayscale.glsl?raw').then(m => m.default),
	uniforms: [] as const,
	params: {
	},
	main: ({ gl, params }) => {
	},
});
