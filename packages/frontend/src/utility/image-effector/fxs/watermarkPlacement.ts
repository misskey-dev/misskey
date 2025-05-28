/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';

const shader = `#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D u_texture_src;
uniform sampler2D u_texture_watermark;
uniform vec2 u_resolution_src;
uniform vec2 u_resolution_watermark;
uniform float u_scale;
uniform float u_angle;
uniform float u_opacity;
uniform bool u_repeat;
uniform int u_alignX; // 0: left, 1: center, 2: right
uniform int u_alignY; // 0: top, 1: center, 2: bottom
uniform int u_fitMode; // 0: contain, 1: cover
out vec4 out_color;

void main() {
	vec4 in_color = texture(u_texture_src, in_uv);

	bool contain = u_fitMode == 0;

	float x_ratio = u_resolution_watermark.x / u_resolution_src.x;
	float y_ratio = u_resolution_watermark.y / u_resolution_src.y;

	float aspect_ratio = contain ?
		(min(x_ratio, y_ratio) / max(x_ratio, y_ratio)) :
		(max(x_ratio, y_ratio) / min(x_ratio, y_ratio));

	float x_scale = contain ?
		(x_ratio > y_ratio ? 1.0 * u_scale : aspect_ratio * u_scale) :
		(x_ratio > y_ratio ? aspect_ratio * u_scale : 1.0 * u_scale);

	float y_scale = contain ?
		(y_ratio > x_ratio ? 1.0 * u_scale : aspect_ratio * u_scale) :
		(y_ratio > x_ratio ? aspect_ratio * u_scale : 1.0 * u_scale);

	float x_offset = u_alignX == 0 ? x_scale / 2.0 : u_alignX == 2 ? 1.0 - (x_scale / 2.0) : 0.5;
	float y_offset = u_alignY == 0 ? y_scale / 2.0 : u_alignY == 2 ? 1.0 - (y_scale / 2.0) : 0.5;

	if (!u_repeat) {
		bool isInside = in_uv.x > x_offset - (x_scale / 2.0) && in_uv.x < x_offset + (x_scale / 2.0) &&
										in_uv.y > y_offset - (y_scale / 2.0) && in_uv.y < y_offset + (y_scale / 2.0);
		if (!isInside) {
			out_color = in_color;
			return;
		}
	}

	vec4 watermark_color = texture(u_texture_watermark, vec2(
		(in_uv.x - (x_offset - (x_scale / 2.0))) / x_scale,
		(in_uv.y - (y_offset - (y_scale / 2.0))) / y_scale
	));

	out_color.r = mix(in_color.r, watermark_color.r, u_opacity * watermark_color.a);
	out_color.g = mix(in_color.g, watermark_color.g, u_opacity * watermark_color.a);
	out_color.b = mix(in_color.b, watermark_color.b, u_opacity * watermark_color.a);
	out_color.a = in_color.a * (1.0 - u_opacity * watermark_color.a) + watermark_color.a * u_opacity;
}
`;

export const FX_watermarkPlacement = defineImageEffectorFx({
	id: 'watermarkPlacement' as const,
	name: '(internal)',
	shader,
	params: {
		cover: {
			type: 'boolean' as const,
			default: false,
		},
		repeat: {
			type: 'boolean' as const,
			default: false,
		},
		scale: {
			type: 'number' as const,
			default: 0.3,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		align: {
			type: 'align' as const,
			default: { x: 'right', y: 'bottom' },
		},
		opacity: {
			type: 'number' as const,
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
	},
	main: ({ gl, program, params, preTexture, width, height, watermark }) => {
		if (watermark == null) {
			return;
		}

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, preTexture);
		const u_texture_src = gl.getUniformLocation(program, 'u_texture_src');
		gl.uniform1i(u_texture_src, 0);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, watermark.texture);
		const u_texture_watermark = gl.getUniformLocation(program, 'u_texture_watermark');
		gl.uniform1i(u_texture_watermark, 1);

		const u_resolution_src = gl.getUniformLocation(program, 'u_resolution_src');
		gl.uniform2fv(u_resolution_src, [width, height]);

		const u_resolution_watermark = gl.getUniformLocation(program, 'u_resolution_watermark');
		gl.uniform2fv(u_resolution_watermark, [watermark.width, watermark.height]);

		const u_scale = gl.getUniformLocation(program, 'u_scale');
		gl.uniform1f(u_scale, params.scale);

		const u_opacity = gl.getUniformLocation(program, 'u_opacity');
		gl.uniform1f(u_opacity, params.opacity);

		const u_angle = gl.getUniformLocation(program, 'u_angle');
		gl.uniform1f(u_angle, 0.0);

		const u_repeat = gl.getUniformLocation(program, 'u_repeat');
		gl.uniform1i(u_repeat, params.repeat ? 1 : 0);

		const u_alignX = gl.getUniformLocation(program, 'u_alignX');
		gl.uniform1i(u_alignX, params.align.x === 'left' ? 0 : params.align.x === 'right' ? 2 : 1);

		const u_alignY = gl.getUniformLocation(program, 'u_alignY');
		gl.uniform1i(u_alignY, params.align.y === 'top' ? 0 : params.align.y === 'bottom' ? 2 : 1);

		const u_fitMode = gl.getUniformLocation(program, 'u_fitMode');
		gl.uniform1i(u_fitMode, params.cover ? 1 : 0);
	},
});
