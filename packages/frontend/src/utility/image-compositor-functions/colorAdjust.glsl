#version 300 es
precision mediump float;

/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_hue;
uniform float u_lightness;
uniform float u_saturation;
out vec4 out_color;

// RGB to HSL
vec3 rgb2hsl(vec3 c) {
	float maxc = max(max(c.r, c.g), c.b);
	float minc = min(min(c.r, c.g), c.b);
	float l = (maxc + minc) * 0.5;
	float s = 0.0;
	float h = 0.0;
	if (maxc != minc) {
		float d = maxc - minc;
		s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
		if (maxc == c.r) {
			h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
		} else if (maxc == c.g) {
			h = (c.b - c.r) / d + 2.0;
		} else {
			h = (c.r - c.g) / d + 4.0;
		}
		h /= 6.0;
	}
	return vec3(h, s, l);
}

// HSL to RGB
float hue2rgb(float p, float q, float t) {
	if (t < 0.0) t += 1.0;
	if (t > 1.0) t -= 1.0;
	if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
	if (t < 1.0/2.0) return q;
	if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
	return p;
}

vec3 hsl2rgb(vec3 hsl) {
	float r, g, b;
	float h = hsl.x;
	float s = hsl.y;
	float l = hsl.z;
	if (s == 0.0) {
		r = g = b = l;
	} else {
		float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
		float p = 2.0 * l - q;
		r = hue2rgb(p, q, h + 1.0/3.0);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1.0/3.0);
	}
	return vec3(r, g, b);
}

void main() {
	vec4 in_color = texture(in_texture, in_uv);
	vec3 color = in_color.rgb;

	color = color * u_brightness;
	color += vec3(u_lightness);
	color = (color - 0.5) * u_contrast + 0.5;

	vec3 hsl = rgb2hsl(color);
	hsl.x = mod(hsl.x + u_hue, 1.0);
	hsl.y = clamp(hsl.y * u_saturation, 0.0, 1.0);

	color = hsl2rgb(hsl);
	out_color = vec4(color, in_color.a);
}
