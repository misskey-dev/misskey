#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform sampler2D u_image;
uniform sampler2D u_topLabel;
uniform sampler2D u_bottomLabel;
uniform float u_paddingTop;
uniform float u_paddingBottom;
uniform float u_paddingLeft;
uniform float u_paddingRight;
out vec4 out_color;

float remap(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
	return outputMin + (outputMax - outputMin) * ((value - inputMin) / (inputMax - inputMin));
}

void main() {
	vec4 image_color = texture(u_image, vec2(
		remap(in_uv.x, u_paddingLeft, 1.0 - u_paddingRight, 0.0, 1.0),
		remap(in_uv.y, u_paddingTop, 1.0 - u_paddingBottom, 0.0, 1.0)
	));

	vec4 topLabel_color = texture(u_topLabel, vec2(
		in_uv.x,
		remap(in_uv.y, 0.0, u_paddingTop, 0.0, 1.0)
	));

	vec4 bottomLabel_color = texture(u_bottomLabel, vec2(
		in_uv.x,
		remap(in_uv.y, 1.0 - u_paddingBottom, 1.0, 0.0, 1.0)
	));

	if (in_uv.y < u_paddingTop) {
		out_color = topLabel_color;
	} else if (in_uv.y > (1.0 - u_paddingBottom)) {
		out_color = bottomLabel_color;
	} else {
		if (in_uv.y > u_paddingTop && in_uv.x > u_paddingLeft && in_uv.x < (1.0 - u_paddingRight)) {
			out_color = image_color;
		} else {
			out_color = vec4(1.0, 1.0, 1.0, 1.0);
		}
	}
}
