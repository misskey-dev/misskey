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
uniform bool u_topLabelEnabled;
uniform bool u_bottomLabelEnabled;
uniform float u_paddingTop;
uniform float u_paddingBottom;
uniform float u_paddingLeft;
uniform float u_paddingRight;
uniform vec3 u_bg;
out vec4 out_color;

float remap(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
	return outputMin + (outputMax - outputMin) * ((value - inputMin) / (inputMax - inputMin));
}

vec3 blendAlpha(vec3 bg, vec4 fg) {
	return fg.a * fg.rgb + (1.0 - fg.a) * bg;
}

void main() {
	vec4 bg = vec4(u_bg, 1.0);

	vec4 image_color = texture(u_image, vec2(
		remap(in_uv.x, u_paddingLeft, 1.0 - u_paddingRight, 0.0, 1.0),
		remap(in_uv.y, u_paddingTop, 1.0 - u_paddingBottom, 0.0, 1.0)
	));

	vec4 topLabel_color = u_topLabelEnabled ? texture(u_topLabel, vec2(
		in_uv.x,
		remap(in_uv.y, 0.0, u_paddingTop, 0.0, 1.0)
	)) : bg;

	vec4 bottomLabel_color = u_bottomLabelEnabled ? texture(u_bottomLabel, vec2(
		in_uv.x,
		remap(in_uv.y, 1.0 - u_paddingBottom, 1.0, 0.0, 1.0)
	)) : bg;

	if (in_uv.y < u_paddingTop) {
		out_color = vec4(blendAlpha(bg.rgb, topLabel_color), 1.0);
	} else if (in_uv.y > (1.0 - u_paddingBottom)) {
		out_color = vec4(blendAlpha(bg.rgb, bottomLabel_color), 1.0);
	} else {
		if (in_uv.y > u_paddingTop && in_uv.x > u_paddingLeft && in_uv.x < (1.0 - u_paddingRight)) {
			out_color = image_color;
		} else {
			out_color = bg;
		}
	}
}
