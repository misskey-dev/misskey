<script setup lang="ts">
/**
 * NoqMessageCard.vue
 * メッセージカード生成コンポーネント
 * - Canvas APIでカード画像を生成
 * - 8種類のデザインテンプレート
 * - 質問文、送信日時、サイトロゴ表示
 * - MFMカスタム絵文字の画像描画対応
 * - 1200x630px PNG形式
 */
import { ref, computed, onMounted, watch } from 'vue';
import * as mfm from 'mfm-js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { customEmojisMap } from '@/custom-emojis.js';
import type { NoqQuestion } from './NoqQuestionCard.vue';

// 仕様: メッセージカードには質問文のみ表示（回答テキストは含めない）
const props = defineProps<{
	question: NoqQuestion;
}>();

const emit = defineEmits<{
	(ev: 'generated', imageDataUrl: string): void;
}>();

// キャンバス参照
const canvasRef = ref<HTMLCanvasElement>();

// カードサイズ（OGP推奨サイズ）
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

// 絵文字画像キャッシュ
const emojiImageCache = new Map<string, HTMLImageElement>();

/**
 * 絵文字画像を読み込む
 */
async function loadEmojiImage(url: string): Promise<HTMLImageElement | null> {
	if (emojiImageCache.has(url)) {
		return emojiImageCache.get(url)!;
	}

	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			emojiImageCache.set(url, img);
			resolve(img);
		};
		img.onerror = () => {
			resolve(null);
		};
		img.src = url;
	});
}

/**
 * MFMテキストをパースしてテキストと絵文字情報を抽出
 */
interface TextSegment {
	type: 'text' | 'emoji' | 'unicodeEmoji';
	content: string;
	emojiUrl?: string;
}

function parseMfmText(text: string): TextSegment[] {
	const segments: TextSegment[] = [];
	const ast = mfm.parseSimple(text);

	function processNode(node: mfm.MfmNode) {
		switch (node.type) {
			case 'text':
				segments.push({ type: 'text', content: node.props.text });
				break;
			case 'emojiCode': {
				const emoji = customEmojisMap.get(node.props.name);
				if (emoji) {
					segments.push({
						type: 'emoji',
						content: `:${node.props.name}:`,
						emojiUrl: emoji.url,
					});
				} else {
					// 見つからない場合はテキストとして表示
					segments.push({ type: 'text', content: `:${node.props.name}:` });
				}
				break;
			}
			case 'unicodeEmoji':
				segments.push({ type: 'unicodeEmoji', content: node.props.emoji });
				break;
			default:
				// その他のノードは子要素を処理
				if ('children' in node && Array.isArray(node.children)) {
					for (const child of node.children) {
						processNode(child);
					}
				}
		}
	}

	for (const node of ast) {
		processNode(node);
	}

	return segments;
}

// デザインテンプレート定義
interface CardDesign {
	id: string;
	name: string;
	backgroundColor: string;
	gradientColors?: [string, string];
	textColor: string;
	accentColor: string;
}

const cardDesigns: CardDesign[] = [
	{ id: 'default', name: i18n.ts._noq.cardDesigns.default, backgroundColor: '#ffffff', textColor: '#333333', accentColor: '#86b300' },
	{ id: 'blue_sky', name: i18n.ts._noq.cardDesigns.blueSky, backgroundColor: '#e8f4fc', gradientColors: ['#87CEEB', '#e8f4fc'], textColor: '#1a5276', accentColor: '#3498db' },
	{ id: 'love', name: i18n.ts._noq.cardDesigns.love, backgroundColor: '#ffe4ec', gradientColors: ['#FF69B4', '#ffe4ec'], textColor: '#8b0a50', accentColor: '#ff1493' },
	{ id: 'nocturne', name: i18n.ts._noq.cardDesigns.nocturne, backgroundColor: '#2c2c54', gradientColors: ['#483D8B', '#2c2c54'], textColor: '#f5f5f5', accentColor: '#9b59b6' },
	{ id: 'romantic', name: i18n.ts._noq.cardDesigns.romantic, backgroundColor: '#fce4ec', gradientColors: ['#DB7093', '#fce4ec'], textColor: '#880e4f', accentColor: '#e91e63' },
	{ id: 'sakura', name: i18n.ts._noq.cardDesigns.sakura, backgroundColor: '#fff5f5', gradientColors: ['#FFB7C5', '#fff5f5'], textColor: '#5d4037', accentColor: '#ff7043' },
	{ id: 'night_sky', name: i18n.ts._noq.cardDesigns.nightSky, backgroundColor: '#0a0a2a', gradientColors: ['#191970', '#0a0a2a'], textColor: '#ffffff', accentColor: '#ffd700' },
	{ id: 'pastel', name: i18n.ts._noq.cardDesigns.pastel, backgroundColor: '#f0f8ff', gradientColors: ['#B0E0E6', '#f0f8ff'], textColor: '#4a6572', accentColor: '#00acc1' },
];

// 選択中のデザイン
const selectedDesign = computed(() => {
	return cardDesigns.find(d => d.id === props.question.cardDesign) ?? cardDesigns[0];
});

/**
 * MFM対応テキスト描画（絵文字画像を含む）
 * @param ctx Canvasコンテキスト
 * @param text 描画するテキスト
 * @param x X座標
 * @param y Y座標
 * @param maxWidth 最大幅
 * @param lineHeight 行の高さ
 * @param fontSize フォントサイズ（絵文字サイズ計算用）
 * @returns 描画終了後のY座標
 */
async function wrapTextWithEmoji(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	fontSize: number,
): Promise<number> {
	const segments = parseMfmText(text);
	const emojiSize = fontSize * 1.2; // 絵文字は少し大きめに

	// 絵文字画像を事前に読み込む
	const emojiImages = new Map<string, HTMLImageElement | null>();
	for (const segment of segments) {
		if (segment.type === 'emoji' && segment.emojiUrl) {
			const img = await loadEmojiImage(segment.emojiUrl);
			emojiImages.set(segment.emojiUrl, img);
		}
	}

	// 行に分割する処理
	interface LineElement {
		type: 'text' | 'emoji' | 'unicodeEmoji';
		content: string;
		width: number;
		emojiImage?: HTMLImageElement | null;
	}

	const lines: LineElement[][] = [];
	let currentLine: LineElement[] = [];
	let currentLineWidth = 0;

	for (const segment of segments) {
		if (segment.type === 'text') {
			// テキストは改行で分割
			const textParts = segment.content.split('\n');
			for (let i = 0; i < textParts.length; i++) {
				const part = textParts[i];
				if (i > 0) {
					// 改行があったので新しい行を開始
					lines.push(currentLine);
					currentLine = [];
					currentLineWidth = 0;
				}

				// 文字ごとに処理
				for (const char of part) {
					const charWidth = ctx.measureText(char).width;
					if (currentLineWidth + charWidth > maxWidth && currentLine.length > 0) {
						lines.push(currentLine);
						currentLine = [];
						currentLineWidth = 0;
					}
					// 既存のテキスト要素に追加するか、新しい要素を作成
					const lastElement = currentLine[currentLine.length - 1];
					if (lastElement && lastElement.type === 'text') {
						lastElement.content += char;
						lastElement.width += charWidth;
					} else {
						currentLine.push({ type: 'text', content: char, width: charWidth });
					}
					currentLineWidth += charWidth;
				}
			}
		} else if (segment.type === 'emoji' && segment.emojiUrl) {
			// カスタム絵文字
			const emojiImage = emojiImages.get(segment.emojiUrl) ?? null;
			if (currentLineWidth + emojiSize > maxWidth && currentLine.length > 0) {
				lines.push(currentLine);
				currentLine = [];
				currentLineWidth = 0;
			}
			currentLine.push({
				type: 'emoji',
				content: segment.content,
				width: emojiSize,
				emojiImage,
			});
			currentLineWidth += emojiSize;
		} else if (segment.type === 'unicodeEmoji') {
			// Unicode絵文字
			const emojiWidth = ctx.measureText(segment.content).width;
			if (currentLineWidth + emojiWidth > maxWidth && currentLine.length > 0) {
				lines.push(currentLine);
				currentLine = [];
				currentLineWidth = 0;
			}
			currentLine.push({ type: 'unicodeEmoji', content: segment.content, width: emojiWidth });
			currentLineWidth += emojiWidth;
		}
	}

	// 最後の行を追加
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}

	// 描画
	let currentY = y;
	for (const line of lines) {
		let currentX = x;
		for (const element of line) {
			if (element.type === 'text' || element.type === 'unicodeEmoji') {
				ctx.fillText(element.content, currentX, currentY);
				currentX += element.width;
			} else if (element.type === 'emoji' && element.emojiImage) {
				// カスタム絵文字を画像として描画
				const imgY = currentY - emojiSize * 0.8; // ベースラインに合わせて調整
				ctx.drawImage(element.emojiImage, currentX, imgY, emojiSize, emojiSize);
				currentX += emojiSize;
			} else if (element.type === 'emoji') {
				// 画像がロードできなかった場合はテキストとして描画
				ctx.fillText(element.content, currentX, currentY);
				currentX += ctx.measureText(element.content).width;
			}
		}
		currentY += lineHeight;
	}

	return currentY;
}

// 後方互換性のための同期版wrapText（絵文字なしの単純なテキスト用）
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
	const lines: string[] = [];
	const paragraphs = text.split('\n');

	for (const paragraph of paragraphs) {
		let line = '';
		const words = paragraph.split('');

		for (const char of words) {
			const testLine = line + char;
			const metrics = ctx.measureText(testLine);
			if (metrics.width > maxWidth && line !== '') {
				lines.push(line);
				line = char;
			} else {
				line = testLine;
			}
		}
		lines.push(line);
	}

	let currentY = y;
	for (const line of lines) {
		ctx.fillText(line, x, currentY);
		currentY += lineHeight;
	}

	return currentY;
}

// カード画像を生成
async function generateCard(): Promise<string> {
	const canvas = canvasRef.value;
	if (!canvas) throw new Error('Canvas not found');

	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas context not found');

	const design = selectedDesign.value;

	// 背景を描画
	if (design.gradientColors) {
		const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
		gradient.addColorStop(0, design.gradientColors[0]);
		gradient.addColorStop(1, design.gradientColors[1]);
		ctx.fillStyle = gradient;
	} else {
		ctx.fillStyle = design.backgroundColor;
	}
	ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

	// 装飾的な要素を描画
	ctx.fillStyle = design.accentColor;
	ctx.globalAlpha = 0.1;
	ctx.beginPath();
	ctx.arc(CARD_WIDTH - 100, 100, 200, 0, Math.PI * 2);
	ctx.fill();
	ctx.beginPath();
	ctx.arc(100, CARD_HEIGHT - 100, 150, 0, Math.PI * 2);
	ctx.fill();
	ctx.globalAlpha = 1;

	// 質問ラベル
	ctx.fillStyle = design.accentColor;
	ctx.font = 'bold 28px "Hiragino Sans", "Meiryo", sans-serif';
	ctx.fillText('Q.', 80, 120);

	// 質問テキスト（MFMカスタム絵文字対応）
	const questionFontSize = 36;
	ctx.fillStyle = design.textColor;
	ctx.font = `${questionFontSize}px "Hiragino Sans", "Meiryo", sans-serif`;
	const questionEndY = await wrapTextWithEmoji(ctx, props.question.text, 130, 120, CARD_WIDTH - 200, 50, questionFontSize);

	// 仕様: メッセージカードには質問文のみ表示、回答テキストは含めない

	// フッター：日時とサイト名
	ctx.fillStyle = design.textColor;
	ctx.globalAlpha = 0.6;
	ctx.font = '24px "Hiragino Sans", "Meiryo", sans-serif';

	// 日時表示（YYYY/M/D HH:mm形式）
	const date = new Date(props.question.createdAt);
	const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
	ctx.fillText(dateStr, 80, CARD_HEIGHT - 60);

	// サイト名（右下）
	const siteName = instance.name ?? 'Misskey';
	const siteNameWidth = ctx.measureText(siteName).width;
	ctx.fillText(siteName, CARD_WIDTH - 80 - siteNameWidth, CARD_HEIGHT - 60);

	ctx.globalAlpha = 1;

	// 枠線
	ctx.strokeStyle = design.accentColor;
	ctx.lineWidth = 4;
	ctx.strokeRect(20, 20, CARD_WIDTH - 40, CARD_HEIGHT - 40);

	// 画像データURLを生成
	return canvas.toDataURL('image/png');
}

// カード生成とダウンロード
async function downloadCard() {
	try {
		const dataUrl = await generateCard();
		const link = document.createElement('a');
		link.download = `noq-card-${props.question.id}.png`;
		link.href = dataUrl;
		link.click();
	} catch (err) {
		console.error('[NoqMessageCard] Failed to download card:', err);
	}
}

// 画像データを親に通知
async function emitGenerated() {
	try {
		const dataUrl = await generateCard();
		emit('generated', dataUrl);
	} catch (err) {
		console.error('[NoqMessageCard] Failed to generate card:', err);
	}
}

// マウント時に初回描画
onMounted(() => {
	generateCard();
});


// 外部から呼び出せるメソッドを公開
defineExpose({
	generateCard,
	downloadCard,
	emitGenerated,
});
</script>

<template>
<div class="noq-message-card">
	<canvas
		ref="canvasRef"
		:width="CARD_WIDTH"
		:height="CARD_HEIGHT"
		class="card-canvas"
	/>
	<div class="card-actions">
		<button class="download-btn" @click="downloadCard">
			<i class="ti ti-download"></i>
			{{ i18n.ts.download }}
		</button>
	</div>
</div>
</template>

<style scoped lang="scss">
.noq-message-card {
	.card-canvas {
		max-width: 100%;
		height: auto;
		border-radius: 8px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.card-actions {
		margin-top: 12px;
		display: flex;
		justify-content: center;

		.download-btn {
			display: flex;
			align-items: center;
			gap: 8px;
			padding: 10px 20px;
			background: var(--accent);
			color: var(--fgOnAccent);
			border: none;
			border-radius: 8px;
			cursor: pointer;
			font-size: 1em;

			&:hover {
				opacity: 0.9;
			}
		}
	}
}
</style>
