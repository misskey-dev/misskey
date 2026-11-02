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

	float r = texture(in_texture, vec2(in_uv.x + (v * (1.0 + u_channelShift)), in_uv.y)).r;
	float g = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).g;
	float b = texture(in_texture, vec2(in_uv.x + (v * (1.0 + (u_channelShift / 2.0))), in_uv.y)).b;
	float a = texture(in_texture, vec2(in_uv.x + v, in_uv.y)).a;
	out_color = vec4(r, g, b, a);
}
