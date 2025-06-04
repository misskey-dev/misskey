/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform vec2 u_pos;
uniform float u_frequency;
uniform bool u_thresholdEnabled;
uniform float u_threshold;
uniform float u_maskSize;
uniform bool u_black;
out vec4 out_color;

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	float angle = atan(-u_pos.y + (in_uv.y), -u_pos.x + (in_uv.x));
	float t = (1.0 + sin(angle * u_frequency)) / 2.0;
	if (u_thresholdEnabled) t = t < u_threshold ? 1.0 : 0.0;
	float d = distance(in_uv * vec2(2.0, 2.0), u_pos * vec2(2.0, 2.0));
	float mask = d < u_maskSize ? 0.0 : ((d - u_maskSize) * (1.0 + (u_maskSize * 2.0)));
	out_color = vec4(
		mix(in_color.r, u_black ? 0.0 : 1.0, t * mask),
		mix(in_color.g, u_black ? 0.0 : 1.0, t * mask),
		mix(in_color.b, u_black ? 0.0 : 1.0, t * mask),
		in_color.a
	);
}
