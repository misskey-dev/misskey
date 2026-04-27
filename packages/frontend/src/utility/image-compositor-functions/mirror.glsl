#version 300 es
precision mediump float;

in vec2 in_uv;
uniform sampler2D in_texture;
uniform vec2 in_resolution;
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
	out_color = texture(in_texture, uv);
}
