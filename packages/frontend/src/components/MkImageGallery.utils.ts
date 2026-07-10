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
	imageRenderingRect,
	sourceRect,
}: {
	fit: string;
	imageRenderingRect: Rect;
	sourceRect: Rect;
}): { x: number; y: number; scale: number } {
	const scale = fit === 'cover'
		? Math.max(sourceRect.width / imageRenderingRect.width, sourceRect.height / imageRenderingRect.height)
		: Math.min(sourceRect.width / imageRenderingRect.width, sourceRect.height / imageRenderingRect.height);

	const sourceImageWidth = imageRenderingRect.width * scale;
	const sourceImageHeight = imageRenderingRect.height * scale;
	const sourceImageLeft = sourceRect.left + (sourceRect.width - sourceImageWidth) / 2;
	const sourceImageTop = sourceRect.top + (sourceRect.height - sourceImageHeight) / 2;

	return {
		x: sourceImageLeft - imageRenderingRect.left * scale,
		y: sourceImageTop - imageRenderingRect.top * scale,
		scale,
	};
}
