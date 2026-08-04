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
import vertexShaderSource from './MkAnimBg.vertex.glsl';
import fragmentShaderSource from './MkAnimBg.fragment.glsl';
import { initShaderProgram } from '@/utility/webgl.js';

const canvasEl = useTemplateRef('canvasEl');

const props = withDefaults(defineProps<{
	scale?: number;
	focus?: number;
}>(), {
	scale: 1.0,
	focus: 1.0,
});

let handle: ReturnType<typeof window['requestAnimationFrame']> | null = null;

onMounted(() => {
	const canvas = canvasEl.value!;
	let width = canvas.offsetWidth;
	let height = canvas.offsetHeight;
	canvas.width = width;
	canvas.height = height;

	const maybeGl = canvas.getContext('webgl2', { premultipliedAlpha: true });
	if (maybeGl == null) return;

	const gl = maybeGl;

	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

	const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
	if (shaderProgram == null) return;

	gl.useProgram(shaderProgram);
	const u_resolution = gl.getUniformLocation(shaderProgram, 'u_resolution');
	const u_time = gl.getUniformLocation(shaderProgram, 'u_time');
	const u_spread = gl.getUniformLocation(shaderProgram, 'u_spread');
	const u_speed = gl.getUniformLocation(shaderProgram, 'u_speed');
	const u_warp = gl.getUniformLocation(shaderProgram, 'u_warp');
	const u_focus = gl.getUniformLocation(shaderProgram, 'u_focus');
	const u_itensity = gl.getUniformLocation(shaderProgram, 'u_itensity');
	const u_scale = gl.getUniformLocation(shaderProgram, 'u_scale');
	gl.uniform2fv(u_resolution, [canvas.width, canvas.height]);
	gl.uniform1f(u_spread, 1.0);
	gl.uniform1f(u_speed, 1.0);
	gl.uniform1f(u_warp, 1.0);
	gl.uniform1f(u_focus, props.focus);
	gl.uniform1f(u_itensity, 0.5);
	gl.uniform2fv(u_scale, [props.scale, props.scale]);

	const vertex = gl.getAttribLocation(shaderProgram, 'position');
	gl.enableVertexAttribArray(vertex);
	gl.vertexAttribPointer(vertex, 2, gl.FLOAT, false, 0, 0);

	const vertices = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

	if (isChromatic()) {
		gl.uniform1f(u_time, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
				gl.uniform2fv(u_resolution, [width, height]);
				gl.viewport(0, 0, width, height);
			}

			gl.uniform1f(u_time, timeStamp);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

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
