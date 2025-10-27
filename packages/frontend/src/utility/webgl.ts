/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function loadShader(gl: WebGL2RenderingContext, type: GLenum, source: string): WebGLShader {
	const shader = gl.createShader(type);
	if (shader == null) {
		throw new Error('falied to create shader');
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(`falied to compile shader: ${gl.getShaderInfoLog(shader)}`);
		gl.deleteShader(shader);
		throw new Error(`falied to compile shader: ${gl.getShaderInfoLog(shader)}`);
	}

	return shader;
}

export function initShaderProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
	const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
	const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

	const shaderProgram = gl.createProgram();

	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);

	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		console.error(`failed to init shader: ${gl.getProgramInfoLog(shaderProgram)}`);
		throw new Error('failed to init shader');
	}

	return shaderProgram;
}
