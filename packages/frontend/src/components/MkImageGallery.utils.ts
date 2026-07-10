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
	neutralSize,
	sourceRect,
	viewportSize,
}: {
	fit: string;
	neutralSize: Size;
	sourceRect: Rect;
	viewportSize: Size;
}): { x: number; y: number; scale: number } {
	const scale = fit === 'cover'
		? Math.max(sourceRect.width / neutralSize.width, sourceRect.height / neutralSize.height)
		: Math.min(sourceRect.width / neutralSize.width, sourceRect.height / neutralSize.height);

	const neutralLeft = (viewportSize.width - neutralSize.width) / 2;
	const neutralTop = (viewportSize.height - neutralSize.height) / 2;
	const sourceImageWidth = neutralSize.width * scale;
	const sourceImageHeight = neutralSize.height * scale;
	const sourceImageLeft = sourceRect.left + (sourceRect.width - sourceImageWidth) / 2;
	const sourceImageTop = sourceRect.top + (sourceRect.height - sourceImageHeight) / 2;

	return {
		x: sourceImageLeft - neutralLeft * scale,
		y: sourceImageTop - neutralTop * scale,
		scale,
	};
}
