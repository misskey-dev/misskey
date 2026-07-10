/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type Size = {
	width: number;
	height: number;
};

type Rect = Size & {
	left: number;
	top: number;
};

export function calculateSourceTransform({
	fit,
	imageRenderingSize,
	sourceRect,
	viewportSize,
}: {
	fit: string;
	imageRenderingSize: Size;
	sourceRect: Rect;
	viewportSize: Size;
}): { x: number; y: number; scale: number } {
	const scale = fit === 'cover'
		? Math.max(sourceRect.width / imageRenderingSize.width, sourceRect.height / imageRenderingSize.height)
		: Math.min(sourceRect.width / imageRenderingSize.width, sourceRect.height / imageRenderingSize.height);

	const neutralLeft = (viewportSize.width - imageRenderingSize.width) / 2;
	const neutralTop = (viewportSize.height - imageRenderingSize.height) / 2;
	const sourceImageWidth = imageRenderingSize.width * scale;
	const sourceImageHeight = imageRenderingSize.height * scale;
	const sourceImageLeft = sourceRect.left + (sourceRect.width - sourceImageWidth) / 2;
	const sourceImageTop = sourceRect.top + (sourceRect.height - sourceImageHeight) / 2;

	return {
		x: sourceImageLeft - neutralLeft * scale,
		y: sourceImageTop - neutralTop * scale,
		scale,
	};
}
