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
out vec4 out_color;

float getBrightness(vec4 color) {
	return (color.r + color.g + color.b) / 3.0;
}

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float brightness = getBrightness(in_color);
	out_color = vec4(brightness, brightness, brightness, in_color.a);
}
`;

export const FX_grayscale = defineImageEffectorFx({
	id: 'grayscale',
	name: i18n.ts._imageEffector._fxs.grayscale,
	shader,
	uniforms: [] as const,
	params: {
	},
	main: ({ gl, params }) => {
	},
});
