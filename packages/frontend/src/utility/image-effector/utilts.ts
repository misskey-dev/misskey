/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { getProxiedImageUrl } from '../media-proxy.js';

export function createTexture(gl: WebGL2RenderingContext): WebGLTexture {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return texture;
}

export async function createTextureFromUrl(gl: WebGL2RenderingContext, imageUrl: string): Promise<{ texture: WebGLTexture, width: number, height: number }> {
	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = getProxiedImageUrl(imageUrl); // CORS対策
	});

	const texture = createTexture(gl);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, image.width, image.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.bindTexture(gl.TEXTURE_2D, null);

	return {
		texture,
		width: image.width,
		height: image.height,
	};
}

export async function createTextureFromText(gl: WebGL2RenderingContext, text: string, resolution = 2048): Promise<{ texture: WebGLTexture, width: number, height: number }> {
	const ctx = window.document.createElement('canvas').getContext('2d')!;
	ctx.canvas.width = resolution;
	ctx.canvas.height = resolution / 4;
	const fontSize = resolution / 32;
	const margin = fontSize / 2;
	ctx.shadowColor = '#000000';
	ctx.shadowBlur = fontSize / 4;

	//ctx.fillStyle = '#00ff00';
	//ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.fillStyle = '#ffffff';
	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.textBaseline = 'middle';

	ctx.fillText(text, margin, ctx.canvas.height / 2);

	const textMetrics = ctx.measureText(text);
	const cropWidth = (Math.ceil(textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft) + margin + margin);
	const cropHeight = (Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) + margin + margin);
	const data = ctx.getImageData(0, (ctx.canvas.height / 2) - (cropHeight / 2), ctx.canvas.width, ctx.canvas.height);

	const texture = createTexture(gl);
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cropWidth, cropHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
	gl.bindTexture(gl.TEXTURE_2D, null);

	const info = {
		texture: texture,
		width: cropWidth,
		height: cropHeight,
	};

	ctx.canvas.remove();

	return info;
}
