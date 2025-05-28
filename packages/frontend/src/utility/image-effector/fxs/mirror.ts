/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';
import { i18n } from '@/i18n.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform int u_h;
uniform int u_v;
out vec4 out_color;

void main() {
	vec2 uv = in_uv;
	if (u_h == -1 && in_uv.x > 0.5) {
		uv.x = 1.0 - uv.x;
	}
	if (u_h == 1 && in_uv.x < 0.5) {
		uv.x = 1.0 - uv.x;
	}
	if (u_v == -1 && in_uv.y > 0.5) {
		uv.y = 1.0 - uv.y;
	}
	if (u_v == 1 && in_uv.y < 0.5) {
		uv.y = 1.0 - uv.y;
	}
	out_color = texture(u_texture, uv);
}
`;

export const FX_mirror = defineImageEffectorFx({
	id: 'mirror' as const,
	name: i18n.ts._imageEffector._fxs.mirror,
	shader,
	params: {
		h: {
			type: 'number:enum' as const,
			enum: [{ value: -1, label: '<-' }, { value: 0, label: '|' }, { value: 1, label: '->' }],
			default: -1,
		},
		v: {
			type: 'number:enum' as const,
			enum: [{ value: -1, label: '^' }, { value: 0, label: '-' }, { value: 1, label: 'v' }],
			default: 0,
		},
	},
	main: ({ gl, program, params, preTexture }) => {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture = gl.getUniformLocation(program, 'u_texture');
		gl.uniform1i(u_texture, 0);

		const u_h = gl.getUniformLocation(program, 'u_h');
		gl.uniform1i(u_h, params.h);

		const u_v = gl.getUniformLocation(program, 'u_v');
		gl.uniform1i(u_v, params.v);
	},
});
