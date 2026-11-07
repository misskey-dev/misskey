<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<canvas ref="canvasEl" style="display: block; width: 100%; height: 100%; pointer-events: none;"></canvas>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import isChromatic from 'chromatic/isChromatic';
import { GLSL_LIB_SNOISE, initShaderProgram } from '@/utility/webgl.js';

const VERTEX_SHADER = `#version 300 es
in vec2 position;
out vec2 in_uv;

void main() {
	in_uv = (position + 1.0) / 2.0;
	gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

const float PI = 3.141592653589793;
const float TWO_PI = 6.283185307179586;
const float HALF_PI = 1.5707963267948966;

${GLSL_LIB_SNOISE}

in vec2 in_uv;
uniform vec2 in_resolution;
uniform float u_scale;
uniform float u_time;
uniform float u_seed;
uniform float u_angle;
uniform float u_radius;
uniform vec3 u_color;
out vec4 out_color;

void main() {
	float x_ratio = min(in_resolution.x / in_resolution.y, 1.0);
	float y_ratio = min(in_resolution.y / in_resolution.x, 1.0);

	float size = 1.0 / u_scale;
	float size_half = size / 2.0;

	float angle = -(u_angle * PI);
	vec2 centeredUv = (in_uv - vec2(0.5, 0.5)) * vec2(x_ratio, y_ratio);
	vec2 rotatedUV = vec2(
		centeredUv.x * cos(angle) - centeredUv.y * sin(angle),
		centeredUv.x * sin(angle) + centeredUv.y * cos(angle)
	);
	vec2 uv = rotatedUV;

	float modX = mod(uv.x, size);
	float modY = mod(uv.y, size);

	vec2 pixelated_uv = vec2(
		(size * (floor((uv.x - 0.5 - size) / size) + 0.5)),
		(size * (floor((uv.y - 0.5 - size) / size) + 0.5))
	) + vec2(0.5 + size, 0.5 + size);

	float time = u_time * 0.00025;

	float noiseAScale = 1.0;
	float noiseAX = (pixelated_uv.x + u_seed) * (u_scale / noiseAScale);
	float noiseAY = (pixelated_uv.y + u_seed) * (u_scale / noiseAScale);
  float noiseA = snoise(vec3(noiseAX, noiseAY, time * 2.0));

	float noiseBScale = 32.0;
	float noiseBX = (pixelated_uv.x + u_seed) * (u_scale / noiseBScale);
	float noiseBY = (pixelated_uv.y + u_seed) * (u_scale / noiseBScale);
  float noiseB = snoise(vec3(noiseBX, noiseBY, time));

	float strength = 0.0;
	strength += noiseA * 0.2;
	strength += noiseB * 0.8;

	float opacity = min(max(strength, 0.0), 1.0);

	float threshold = ((u_radius / 2.0) / u_scale);
	if (length(vec2(modX - size_half, modY - size_half)) < threshold) {
		out_color = vec4(u_color.r, u_color.g, u_color.b, opacity);
		return;
	}

	out_color = vec4(0.0, 0.0, 0.0, 0.0);
}
`;

const canvasEl = useTemplateRef('canvasEl');

const props = withDefaults(defineProps<{
	scale?: number;
}>(), {
	scale: 48,
});

let handle: ReturnType<typeof window['requestAnimationFrame']> | null = null;

onMounted(() => {
	const canvas = canvasEl.value!;
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;
	canvas.width = width;
	canvas.height = height;

	const maybeGl = canvas.getContext('webgl2', { preserveDrawingBuffer: false, alpha: true, premultipliedAlpha: false, antialias: true });
	if (maybeGl == null) return;

	const gl = maybeGl;

	const VERTICES = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, VERTICES, gl.STATIC_DRAW);

	//gl.clearColor(0.0, 0.0, 0.0, 0.0);
	//gl.clear(gl.COLOR_BUFFER_BIT);

	const shaderProgram = initShaderProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);

	gl.useProgram(shaderProgram);

	const positionLocation = gl.getAttribLocation(shaderProgram, 'position');
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(positionLocation);

	const in_resolution = gl.getUniformLocation(shaderProgram, 'in_resolution');
	gl.uniform2fv(in_resolution, [canvas.width, canvas.height]);

	const u_time = gl.getUniformLocation(shaderProgram, 'u_time');
	const u_seed = gl.getUniformLocation(shaderProgram, 'u_seed');
	const u_scale = gl.getUniformLocation(shaderProgram, 'u_scale');
	const u_angle = gl.getUniformLocation(shaderProgram, 'u_angle');
	const u_radius = gl.getUniformLocation(shaderProgram, 'u_radius');
	const u_color = gl.getUniformLocation(shaderProgram, 'u_color');
	gl.uniform1f(u_seed, Math.random() * 1000);
	gl.uniform1f(u_scale, props.scale);
	gl.uniform1f(u_angle, 0.0);
	gl.uniform1f(u_radius, 0.15);
	gl.uniform3fv(u_color, [0.5, 1.0, 0]);

	if (isChromatic()) {
		gl.uniform1f(u_time, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	} else {
		function render(timeStamp: number) {
			let sizeChanged = false;
			if (Math.abs(height - canvas.offsetHeight) > 2) {
				height = canvas.offsetHeight;
				canvas.height = height;
				sizeChanged = true;
			}
			if (Math.abs(width - canvas.offsetWidth) > 2) {
				width = canvas.offsetWidth;
				canvas.width = width;
				sizeChanged = true;
			}
			if (sizeChanged && gl) {
				gl.uniform2fv(in_resolution, [width, height]);
				gl.viewport(0, 0, width, height);
			}

			gl.uniform1f(u_time, timeStamp);

			gl.drawArrays(gl.TRIANGLES, 0, 6);

			handle = window.requestAnimationFrame(render);
		}

		handle = window.requestAnimationFrame(render);
	}
});

onUnmounted(() => {
	if (handle) {
		window.cancelAnimationFrame(handle);
	}

	// TODO: WebGLリソースの解放
});
</script>

<style lang="scss" module>
</style>
