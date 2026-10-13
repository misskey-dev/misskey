#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// エイリアスを解決してくれないので、プロジェクトルートからの絶対パスにする必要がある
#include /src/shaders/snoise;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform vec2 u_pos;
uniform float u_frequency;
uniform float u_threshold;
uniform float u_outlineThickness;
uniform float u_maskSize;
out vec4 out_color;

float remap(float value, float inputMin, float inputMax, float outputMin, float outputMax) {
	return outputMin + (outputMax - outputMin) * ((value - inputMin) / (inputMax - inputMin));
}

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	vec2 centeredUv = (in_uv - vec2(0.5, 0.5));
	vec2 uv = centeredUv;

	float seed = 1.0;
	float time = 0.0;

	vec2 noiseUV = (uv - u_pos) / distance((uv - u_pos), vec2(0.0));
	float noiseX = (noiseUV.x + seed) * u_frequency;
	float noiseY = (noiseUV.y + seed) * u_frequency;
  float noise = (1.0 + snoise(vec3(noiseX, noiseY, time))) / 2.0;

	if (noise < u_threshold) {
		out_color = in_color;
	} else {
		float n = remap(noise, u_threshold, 1.0, 0.0, 1.0);

		// TODO: マスクの形自体も揺らぎを与える
		float d = distance(uv * vec2(2.0, 2.0), u_pos * vec2(2.0, 2.0));
		float mask = d < u_maskSize ? 0.0 : ((d - u_maskSize) * (1.0 + (u_maskSize * 2.0)));
		out_color = vec4(
			mix(in_color.r, n < u_outlineThickness ? 0.0 : 1.0, mask),
			mix(in_color.g, n < u_outlineThickness ? 0.0 : 1.0, mask),
			mix(in_color.b, n < u_outlineThickness ? 0.0 : 1.0, mask),
			in_color.a
		);
	}
}
