/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { defineEffectLayer, createCubicBezier } from '@/scripts/effect-layer.js';
import { resolveCustomEmojiUrl } from '@/scripts/emoji.js';
import { defaultStore } from '@/store.js';
import { char2fluentEmojiFilePath, char2twemojiFilePath } from '@@/js/emoji-base.js';

const transformEase = createCubicBezier(0, 0.5, 0, 1);
const opacityEase = createCubicBezier(0.5, 0, 1, 0.5);

// しきい値
const reactionDuration = 1100;
const height = 24;

// reactionを画像URLへ解決する関数
function resolveReactionImage(reaction: string) {
	if (reaction[0] === ':') {
		return resolveCustomEmojiUrl(reaction, undefined, false, true);
	} else {
		// native絵文字の場合、スタイルに応じてパスを生成
		const style = defaultStore.state.emojiStyle;
		return style === 'fluent'
			? char2fluentEmojiFilePath(reaction)
			: char2twemojiFilePath(reaction);
	}
}

export const launchReactionEffect = defineEffectLayer((ctx, x: number, y: number, reaction: string) => {
	// 初回フレームでreaction, ランダムな角度、アクセントカラー、Imageを保存
	if (ctx.isFirstFrame) {
		const angle = 90 - Math.random() * 180; // 数値として保存
		const resolvedUrl = resolveReactionImage(reaction);
		console.log(resolvedUrl);
		let img: HTMLImageElement | null = null;
		if (resolvedUrl) {
			img = new Image();
			img.src = resolvedUrl;
		}
		ctx.saveStore({ angle, img });
	}

	const { angle, img } = ctx.store as { angle: number, img: HTMLImageElement | null };
	const elapsed = ctx.timestamp - ctx.firstFrameAt;
	const canvasCtx = ctx.ctx;
	const progress = Math.min(elapsed / reactionDuration, 1);

	// イージング適用
	const tTransform = transformEase(progress);
	const tOpacity = opacityEase(progress);

	// 描画位置
	const translateY = -30 - (20 * tTransform);
	const rotationRad = (angle * Math.PI / 180) * tTransform;
	const alpha = 1 - tOpacity;

	// imgが解決できた場合は画像描画
	if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
		canvasCtx.save();
		canvasCtx.translate(x, y);
		canvasCtx.translate(0, translateY);
		canvasCtx.rotate(rotationRad);
		canvasCtx.globalAlpha = alpha;
		const width = (img.naturalWidth / img.naturalHeight) * height;
		canvasCtx.drawImage(img, -width / 2, -height / 2, width, height);
		canvasCtx.restore();
	}

	if (alpha <= 0) {
		ctx.done();
	}
}, 1200);
