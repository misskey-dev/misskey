#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform int u_amount;
uniform float u_shiftStrengths[128];
uniform vec2 u_shiftOrigins[128];
uniform vec2 u_shiftSizes[128];
uniform float u_channelShift;
out vec4 out_color;

void main() {
	// TODO: ピクセル毎に計算する必要はないのでuniformにする
	float aspect_ratio = min(in_resolution.x, in_resolution.y) / max(in_resolution.x, in_resolution.y);
	float aspect_ratio_x = in_resolution.x > in_resolution.y ? 1.0 : aspect_ratio;
	float aspect_ratio_y = in_resolution.x < in_resolution.y ? 1.0 : aspect_ratio;

	float v = 0.0;

	for (int i = 0; i < u_amount; i++) {
		if (
			in_uv.x * aspect_ratio_x > ((u_shiftOrigins[i].x * aspect_ratio_x) - u_shiftSizes[i].x) &&
			in_uv.x * aspect_ratio_x < ((u_shiftOrigins[i].x * aspect_ratio_x) + u_shiftSizes[i].x) &&
			in_uv.y * aspect_ratio_y > ((u_shiftOrigins[i].y * aspect_ratio_y) - u_shiftSizes[i].y) &&
			in_uv.y * aspect_ratio_y < ((u_shiftOrigins[i].y * aspect_ratio_y) + u_shiftSizes[i].y)
		) {
			v += u_shiftStrengths[i];
		}
	}

	float r = texture(in_texture, vec2(in_uv.x + (v * (1.0 + u_channelShift)), in_uv.y)).r;
	float g = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).g;
	float b = texture(in_texture, vec2(in_uv.x + (v * (1.0 + (u_channelShift / 2.0))), in_uv.y)).b;
	float a = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).a;
	out_color = vec4(r, g, b, a);
}
