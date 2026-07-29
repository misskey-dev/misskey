<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<audio
		ref="audioEl"
		preload="metadata"
		:src="content.url"
		@loadedmetadata="emit('loadedmetadata')"
	></audio>
	<canvas
		ref="canvasEl"
		width="1600"
		height="900"
		data-gallery-click-action="media"
		:class="$style.visualizer"
	></canvas>
</div>
</template>

<script setup lang="ts">
import { useTemplateRef, shallowRef, computed, watch, onBeforeUnmount } from 'vue';
import tinycolor from 'tinycolor2';
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';
import type { Content } from '@/components/MkLightbox.item.vue';

const props = defineProps<{
	content: Content;
	volume: number;
}>();

const emit = defineEmits<{
	(ev: 'loadedmetadata'): void;
}>();

const audioEl = useTemplateRef('audioEl');
const canvasEl = useTemplateRef('canvasEl');
const canvasCtx = computed(() => canvasEl.value?.getContext('2d') ?? null);

const FFT_SIZE = 2048;
const WAVE_THRESHOLD = 50; // 波形の閾値
const EXPONENTIAL_FACTOR = 2; // 波形の伸びを調整する指数
const WAVE_REFRESH_THRESHOLD = 2; // 波形の更新間隔（フレーム数）
/** 時間領域データにおける無音の値 (符号なし8bitの中央値) */
const SILENT_VALUE = 128;

const bufferLength = FFT_SIZE / 2;
const dataArray = new Uint8Array(bufferLength).fill(SILENT_VALUE);
const prevDataArray = new Uint8Array(bufferLength).fill(SILENT_VALUE);

const bgColor = computed(() => {
	return props.content.file?.user?.avatarBlurhash ? extractAvgColorFromBlurhash(props.content.file.user.avatarBlurhash) ?? '#aaa' : '#aaa';
});
const fgColor = computed(() => {
	const tcInstance = tinycolor(bgColor.value);
	if (tcInstance.isDark()) {
		return tcInstance.lighten(20).toHexString();
	} else {
		return tcInstance.darken(20).toHexString();
	}
});

// 読み込みが終わるまでは描画しない (読み込み完了時の描き直しは下のwatchで行う)
const avatarImage = shallowRef<HTMLImageElement | null>(null);

//#region audio graph
let audioCtx: AudioContext | null = null;
let audioSource: MediaElementAudioSourceNode | null = null;
let channelMergerNode: ChannelMergerNode | null = null;
let analyserNode: AnalyserNode | null = null;
let gainNode: GainNode | null = null;
let abortController: AbortController | null = null;

let visualizerTickFrameId: number | null = null;
let visualizerTickCount = 0;

function resumeAudioCtx() {
	if (audioCtx == null || audioCtx.state !== 'suspended') return;
	audioCtx.resume().catch(err => {
		console.error('Failed to resume AudioContext:', err);
	});
}

function visualizerTick() {
	draw();
	visualizerTickFrameId = window.requestAnimationFrame(visualizerTick);
}

function startVisualizerTick() {
	if (visualizerTickFrameId != null) return;
	visualizerTickFrameId = window.requestAnimationFrame(visualizerTick);
}

function stopVisualizerTick() {
	if (visualizerTickFrameId == null) return;
	window.cancelAnimationFrame(visualizerTickFrameId);
	visualizerTickFrameId = null;
}

function init() {
	const el = audioEl.value;
	if (el == null) return;

	audioCtx = new AudioContext();
	channelMergerNode = audioCtx.createChannelMerger(2);
	analyserNode = audioCtx.createAnalyser();
	analyserNode.smoothingTimeConstant = 0.85;
	analyserNode.fftSize = FFT_SIZE;
	gainNode = audioCtx.createGain();
	gainNode.gain.value = props.volume;
	audioSource = audioCtx.createMediaElementSource(el);

	// ビジュアライザー用
	audioSource.connect(channelMergerNode).connect(analyserNode);
	// 再生
	audioSource.connect(gainNode).connect(audioCtx.destination);

	// 音量制御はGainNodeが担当するため、要素側は常に100%
	// (ミュートは音量0として表現する。要素をmutedにするとタップまで無音になり波形が消える)
	el.volume = 1;
	el.muted = false;

	abortController = new AbortController();
	const signal = abortController.signal;

	const on = (type: keyof HTMLMediaElementEventMap, listener: () => void) => {
		el.addEventListener(type, listener, { signal });
	};

	// 再生状態: メディア要素のイベントを唯一の情報源にすることで、このコンポーネント経由でない
	// 操作 (コントロール・キーボード・OSのメディアキー等) でも波形の描画と同期がとれる
	on('play', resumeAudioCtx);
	on('playing', startVisualizerTick);
	on('waiting', stopVisualizerTick);
	on('pause', stopVisualizerTick);
	on('ended', stopVisualizerTick);
	on('emptied', stopVisualizerTick);

	// 現在の要素の状態を取り込む (コンポーネントの準備前に再生が始まっている場合等)
	if (el.paused) {
		draw();
	} else {
		resumeAudioCtx();
		startVisualizerTick();
	}
}

function teardown() {
	abortController?.abort();
	abortController = null;
	stopVisualizerTick();
	audioSource?.disconnect();
	audioSource = null;
	analyserNode?.disconnect();
	analyserNode = null;
	gainNode?.disconnect();
	gainNode = null;
	if (audioCtx != null && audioCtx.state !== 'closed') {
		audioCtx.close().catch(err => {
			console.error('Failed to close AudioContext:', err);
		});
	}
	audioCtx = null;
}
//#endregion

function draw() {
	if (canvasEl.value == null || canvasCtx.value == null) return;

	visualizerTickCount++;
	const tickStep = visualizerTickCount % WAVE_REFRESH_THRESHOLD;

	canvasCtx.value.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);

	if (tickStep === 0) {
		prevDataArray.set(dataArray);
		analyserNode?.getByteTimeDomainData(dataArray);
	}

	canvasCtx.value.fillStyle = bgColor.value;
	canvasCtx.value.fillRect(0, 0, canvasEl.value.width, canvasEl.value.height);

	const centerX = canvasEl.value.width / 2;
	const centerY = canvasEl.value.height / 2;
	const radius = Math.min(centerX, centerY) * 0.8;

	canvasCtx.value.beginPath();
	canvasCtx.value.fillStyle = fgColor.value;

	// 波形データを円形に滑らかにつなぐ
	const points: { x: number, y: number }[] = [];
	for (let i = 0; i < bufferLength; i++) {
		if (i % WAVE_THRESHOLD !== 0 && i !== bufferLength - 1) continue; // Skip values below threshold

		const data = prevDataArray[i] + (dataArray[i] - prevDataArray[i]) * tickStep / WAVE_REFRESH_THRESHOLD;
		const value = Math.pow(data / 255 * Math.sqrt(EXPONENTIAL_FACTOR), EXPONENTIAL_FACTOR); // Exponential scaling

		const angle = (i / bufferLength) * Math.PI - (Math.PI / 2); // 半円分の角度に制限
		const x = centerX + radius * value * Math.cos(angle);
		const y = centerY + radius * value * Math.sin(angle);
		points.push({ x, y });
	}

	// 残りの半分を左右反転
	const mirroredPoints = points.map(point => ({ x: centerX - (point.x - centerX), y: point.y })).reverse();

	if (points.length > 0) {
		canvasCtx.value.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length - 1; i++) {
			const xc = (points[i].x + points[i + 1].x) / 2;
			const yc = (points[i].y + points[i + 1].y) / 2;
			canvasCtx.value.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
		}
		canvasCtx.value.lineTo(mirroredPoints[0].x, mirroredPoints[0].y);

		for (let i = 1; i < mirroredPoints.length - 1; i++) {
			const xc = (mirroredPoints[i].x + mirroredPoints[i + 1].x) / 2;
			const yc = (mirroredPoints[i].y + mirroredPoints[i + 1].y) / 2;
			canvasCtx.value.quadraticCurveTo(mirroredPoints[i].x, mirroredPoints[i].y, xc, yc);
		}

		canvasCtx.value.lineTo(points[0].x, points[0].y);
	}

	canvasCtx.value.closePath();
	canvasCtx.value.fill();

	if (avatarImage.value == null) return;

	// 波形の中心にアバターを円形にくりぬいて描画
	const avatarSize = radius;
	const avatarHeight = Math.max(avatarImage.value.height * (avatarSize / avatarImage.value.width), avatarSize);
	const avatarWidth = Math.max(avatarImage.value.width * (avatarSize / avatarImage.value.height), avatarSize);
	const avatarDx = centerX - avatarWidth / 2;
	const avatarDy = centerY - avatarHeight / 2;
	canvasCtx.value.save();
	canvasCtx.value.beginPath();
	canvasCtx.value.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
	canvasCtx.value.clip();
	canvasCtx.value.drawImage(avatarImage.value, avatarDx, avatarDy, avatarWidth, avatarHeight);
	canvasCtx.value.restore();
}

watch(() => props.volume, (to) => {
	if (gainNode == null) return;
	gainNode.gain.value = to;
});

watch(() => props.content.file?.user?.avatarUrl, (avatarUrl) => {
	const img = new Image();
	img.addEventListener('load', () => {
		avatarImage.value = img;
		// 停止中は再描画の機会が無いので、読み込み完了時に自前で描き直す
		if (visualizerTickFrameId == null) draw();
	}, { once: true });
	img.src = avatarUrl ?? '/static-assets/avatar.png';
}, { immediate: true });

watch(audioEl, () => {
	teardown();
	init();
}, { immediate: true });

onBeforeUnmount(teardown);

defineExpose({
	audioEl,
});
</script>

<style module lang="scss">
.root {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
}

.visualizer {
	display: block;
	user-select: none;
	// 100cqw / 100cqhの基準はMkLightbox.item.vueの.contentWrapper (= paddingを除いた実際の表示領域)
	width: min(100cqw, calc(100cqh * 16 / 9));
	height: auto;
	aspect-ratio: 16 / 9;
}
</style>
