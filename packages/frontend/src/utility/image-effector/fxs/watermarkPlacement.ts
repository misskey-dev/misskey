/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineImageEffectorFx } from '../ImageEffector.js';

const shader = `#version 300 es
precision mediump float;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform sampler2D u_texture_watermark;
uniform vec2 u_resolution_watermark;
uniform float u_scale;
uniform float u_angle;
uniform float u_opacity;
uniform bool u_repeat;
uniform int u_alignX; // 0: left, 1: center, 2: right
uniform int u_alignY; // 0: top, 1: center, 2: bottom
uniform float u_alignMargin;
uniform int u_fitMode; // 0: contain, 1: cover
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float in_x_ratio = max(in_resolution.x / in_resolution.y, 1.0);
	float in_y_ratio = max(in_resolution.y / in_resolution.x, 1.0);

	bool contain = u_fitMode == 0;

	float x_ratio = u_resolution_watermark.x / in_resolution.x;
	float y_ratio = u_resolution_watermark.y / in_resolution.y;

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

	x_offset += (u_alignX == 0 ? 1.0 : u_alignX == 2 ? -1.0 : 0.0) * u_alignMargin;
	y_offset += (u_alignY == 0 ? 1.0 : u_alignY == 2 ? -1.0 : 0.0) * u_alignMargin;

	float angle = -(u_angle * PI);
	vec2 center = vec2(x_offset, y_offset);
	//vec2 centeredUv = (in_uv - center) * vec2(in_x_ratio, in_y_ratio);
	vec2 centeredUv = (in_uv - center);
	vec2 rotatedUV = vec2(
		centeredUv.x * cos(angle) - centeredUv.y * sin(angle),
		centeredUv.x * sin(angle) + centeredUv.y * cos(angle)
	) + center;

	// trim
	if (!u_repeat) {
		bool isInside = rotatedUV.x > x_offset - (x_scale / 2.0) && rotatedUV.x < x_offset + (x_scale / 2.0) &&
										rotatedUV.y > y_offset - (y_scale / 2.0) && rotatedUV.y < y_offset + (y_scale / 2.0);
		if (!isInside) {
			out_color = in_color;
			return;
		}
	}

	vec4 watermark_color = texture(u_texture_watermark, vec2(
		(rotatedUV.x - (x_offset - (x_scale / 2.0))) / x_scale,
		(rotatedUV.y - (y_offset - (y_scale / 2.0))) / y_scale
	));

	out_color.r = mix(in_color.r, watermark_color.r, u_opacity * watermark_color.a);
	out_color.g = mix(in_color.g, watermark_color.g, u_opacity * watermark_color.a);
	out_color.b = mix(in_color.b, watermark_color.b, u_opacity * watermark_color.a);
	out_color.a = in_color.a * (1.0 - u_opacity * watermark_color.a) + watermark_color.a * u_opacity;
}
`;

export const FX_watermarkPlacement = defineImageEffectorFx({
	id: 'watermarkPlacement',
	name: '(internal)',
	shader,
	uniforms: ['texture_watermark', 'resolution_watermark', 'scale', 'angle', 'opacity', 'repeat', 'alignX', 'alignY', 'alignMargin', 'fitMode'] as const,
	params: {
		cover: {
			type: 'boolean',
			default: false,
		},
		repeat: {
			type: 'boolean',
			default: false,
		},
		scale: {
			type: 'number',
			default: 0.3,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		angle: {
			type: 'number',
			default: 0,
			min: -1.0,
			max: 1.0,
			step: 0.01,
		},
		align: {
			type: 'align',
			default: { x: 'right', y: 'bottom', margin: 0 },
		},
		opacity: {
			type: 'number',
			default: 0.75,
			min: 0.0,
			max: 1.0,
			step: 0.01,
		},
		watermark: {
			type: 'texture',
			default: null,
		},
	},
	main: ({ gl, u, params, textures }) => {
		if (textures.watermark == null) {
			return;
		}

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, textures.watermark.texture);
		gl.uniform1i(u.texture_watermark, 1);

		gl.uniform2fv(u.resolution_watermark, [textures.watermark.width, textures.watermark.height]);
		gl.uniform1f(u.scale, params.scale);

		gl.uniform1f(u.opacity, params.opacity);
		gl.uniform1f(u.angle, params.angle);
		gl.uniform1i(u.repeat, params.repeat ? 1 : 0);
		gl.uniform1i(u.alignX, params.align.x === 'left' ? 0 : params.align.x === 'right' ? 2 : 1);
		gl.uniform1i(u.alignY, params.align.y === 'top' ? 0 : params.align.y === 'bottom' ? 2 : 1);
		gl.uniform1f(u.alignMargin, params.align.margin ?? 0);
		gl.uniform1i(u.fitMode, params.cover ? 1 : 0);
	},
});
