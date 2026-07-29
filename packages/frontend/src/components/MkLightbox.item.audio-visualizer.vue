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
	<div v-if="!isActuallyPlaying" :class="$style.playIconWrapper">
		<div :class="$style.playIcon">
			<i class="ti ti-player-play"></i>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { useTemplateRef, shallowRef, ref, computed, watch, onBeforeUnmount } from 'vue';
import { themeManager } from '@/theme.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
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

const isActuallyPlaying = ref(false);

//#region 描画パラメータ
// 低域の分解能を確保するため大きめの FFT を使う (48kHz で bin 幅 ≒ 11.7Hz)
const FFT_SIZE = 4096;
const BIN_COUNT = FFT_SIZE / 2;

/** 波形の制御点数 (片側)。実際の輪郭はこれを左右にミラーした 2 倍の点で構成される */
const BAND_COUNT = 36;
/** スペクトルとして取り出す周波数レンジ */
const MIN_FREQ = 100;
const MAX_FREQ = 12800;
/** ビートとして扱う低域の上限 */
const BASS_MAX_FREQ = 220;

/** 下限が下がる / 上がるときの時定数 (s) 上げ側を遅くして、鳴っている間に基準が持ち上がらないようにする */
const BAND_FLOOR_FALL_TAU = 0.25;
const BAND_FLOOR_RISE_TAU = 4;
/** 上限が下がるときの時定数 (s) 上がるときは即時 */
const BAND_CEIL_FALL_TAU = 1.4;
/** 帯域が取りうる幅の下限。これ以下に潰れた帯域を無理に引き伸ばさない */
const MIN_BAND_SPAN = 0.14;
/** この上限に届かない帯域 (そもそも鳴っていない帯域) は、その比率だけ振れ幅を抑える */
const ACTIVE_CEIL_REF = 0.25;
/** 正規化後にかけるコントラスト強調の指数 1 より大きいほど山が尖る */
const CONTRAST_EXPONENT = 1.35;
/** 無音ゲート フレーム平均がこの下限からこの幅の間で 0→1 になる */
const GATE_FLOOR = 0.02;
const GATE_RANGE = 0.08;

/** 波形の立ち上がり / 立ち下がりの時定数 (s) */
const WAVE_ATTACK_TAU = 0.01;
const WAVE_RELEASE_TAU = 0.015;

/** 基準半径に対する波形の振れ幅 */
const WAVE_GAIN = 0.9;
/** Catmull-Rom スプラインの張り具合 大きいほど丸く、0 に近いほど折れ線に近づく */
const SPLINE_TENSION = 0.9;

/** 全体の音圧に追従する緩やかな拡大縮小の時定数 (s) と最大量 */
const LEVEL_TAU = 0.3;
const LEVEL_SCALE = 0.07;
/** ビート検出用の低域エンベロープ / その移動平均の時定数 (s) */
const BASS_ATTACK_TAU = 0.012;
const BASS_RELEASE_TAU = 0.11;
const BASS_BASELINE_TAU = 0.7;
/** 移動平均からの超過分をビートとみなす際の増幅率と、減衰の時定数 (s) */
const BEAT_SENSITIVITY = 2.4;
const BEAT_RELEASE_TAU = 0.18;
/** ビートに合わせて瞬間的に拡大する量 */
const BEAT_SCALE = 0.09;

/** キャンバス短辺の半分に対する、無音時の波形半径の比 */
const BASE_RADIUS_RATIO = 0.36;
/** 波形の基準円に対するアバターの直径比 */
const AVATAR_RATIO = 1;

/** 1 フレームで進める時間の上限 (s) */
const MAX_DELTA = 0.1;
//#endregion

// アニメーション量を控えるべきかどうか（拡大縮小のみ抑制）
const motionDamp = !prefer.s.animation ? 0.3 : 1;

//#region 解析バッファ
const freqArray = new Uint8Array(BIN_COUNT);
/** 帯域ごとに参照する bin の範囲 */
const bandStart = new Uint16Array(BAND_COUNT);
const bandEnd = new Uint16Array(BAND_COUNT);
/** 低域 (ビート検出対象) かどうか */
const bandIsBass = new Uint8Array(BAND_COUNT);
/** 帯域ごとの生の振幅 (フレーム内の作業用) */
const rawLevels = new Float32Array(BAND_COUNT);
/** 帯域ごとの自動レンジ調整が追跡している下限 / 上限 */
const bandFloors = new Float32Array(BAND_COUNT);
const bandCeils = new Float32Array(BAND_COUNT);
/** 全体音圧 (index 0) と低域 (index 1) 用の、同じく自動レンジ調整の下限 / 上限 */
const aggFloors = new Float32Array(2);
const aggCeils = new Float32Array(2);
/** 帯域ごとの平滑化済み振幅 (0-1) */
const levels = new Float32Array(BAND_COUNT);
/** 輪郭の頂点座標 */
const pointsX = new Float64Array(BAND_COUNT * 2);
const pointsY = new Float64Array(BAND_COUNT * 2);

let levelEnv = 0;
let bassEnv = 0;
let bassBaseline = 0;
let beatEnv = 0;

function setupBands(sampleRate: number) {
	const ratio = MAX_FREQ / MIN_FREQ;
	for (let i = 0; i < BAND_COUNT; i++) {
		const lowFreq = MIN_FREQ * Math.pow(ratio, i / BAND_COUNT);
		const highFreq = MIN_FREQ * Math.pow(ratio, (i + 1) / BAND_COUNT);
		const toBin = (freq: number) => freq * FFT_SIZE / sampleRate;
		const start = Math.min(Math.max(Math.floor(toBin(lowFreq)), 0), BIN_COUNT - 1);
		const end = Math.min(Math.max(Math.ceil(toBin(highFreq)), start + 1), BIN_COUNT);
		bandStart[i] = start;
		bandEnd[i] = end;
		bandIsBass[i] = lowFreq < BASS_MAX_FREQ ? 1 : 0;
	}
}

function resetAnalysis() {
	levels.fill(0);
	bandFloors.fill(0);
	bandCeils.fill(0);
	aggFloors.fill(0);
	aggCeils.fill(0);
	levelEnv = 0;
	bassEnv = 0;
	bassBaseline = 0;
	beatEnv = 0;
}

// AudioContext ができる前に描画されても NaN にならないよう、暫定のサンプルレートで初期化しておく
setupBands(48000);

/**
 * 指数平滑。フレームレートに依存しないよう、経過時間から係数を求める
 * @param tau 目標値の約 63% まで近づくのにかかる秒数
 */
function approach(current: number, target: number, tau: number, dt: number) {
	if (tau <= 0) return target;
	return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/**
 * 直近の下限・上限を追跡して値を 0-1 に引き伸ばす (自動レンジ調整)。
 * 下限 / 上限の状態は呼び出し側の配列に持たせ、帯域ごと・集計値ごとに独立させる
 */
function adaptiveNorm(value: number, floors: Float32Array, ceils: Float32Array, index: number, dt: number) {
	const floor = approach(floors[index], value, value < floors[index] ? BAND_FLOOR_FALL_TAU : BAND_FLOOR_RISE_TAU, dt);
	floors[index] = floor;

	// 上限は即座に持ち上げ、ゆっくり戻す。戻り先に下限 + 最小幅を混ぜて、レンジが潰れないようにする
	const ceil = value > ceils[index] ? value : approach(ceils[index], Math.max(value, floor + MIN_BAND_SPAN), BAND_CEIL_FALL_TAU, dt);
	ceils[index] = ceil;

	const span = Math.max(ceil - floor, MIN_BAND_SPAN);
	return Math.min(Math.max((value - floor) / span, 0), 1);
}
//#endregion

const defaultBgColor = themeManager.currentCompiledTheme?.accent ?? '#aaa';
const bgColor = computed(() => {
	const tcInstance = tinycolor(props.content.file?.user?.avatarBlurhash ? extractAvgColorFromBlurhash(props.content.file.user.avatarBlurhash) ?? defaultBgColor : defaultBgColor);
	let targetLightness, targetSaturation;
	if (store.r.darkMode.value) {
		targetLightness = 0.1;
		targetSaturation = 0.8;
	} else {
		targetLightness = 0.9;
		targetSaturation = 0.9;
	}
	return `hsl(${tcInstance.toHsl().h}, ${targetSaturation * 100}%, ${targetLightness * 100}%)`;
});
const fgColor = computed(() => {
	const tcInstance = tinycolor(bgColor.value);
	let targetLightness, targetSaturation;
	if (store.r.darkMode.value) {
		targetLightness = 0.25;
		targetSaturation = 0.8;
	} else {
		targetLightness = 0.7;
		targetSaturation = 0.7;
	}
	return `hsl(${tcInstance.toHsl().h}, ${targetSaturation * 100}%, ${targetLightness * 100}%)`;
});

// 読み込みが終わるまでは描画しない (読み込み完了時の描き直しは下のwatchで行う)
const avatarImage = shallowRef<HTMLImageElement | null>(null);

//#region audio graph
let audioCtx: AudioContext | null = null;
let audioSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let gainNode: GainNode | null = null;
let abortController: AbortController | null = null;

let visualizerTickFrameId: number | null = null;
let lastTickTimestamp = 0;

function resumeAudioCtx() {
	if (audioCtx == null || audioCtx.state !== 'suspended') return;
	audioCtx.resume().catch(err => {
		console.error('Failed to resume AudioContext:', err);
	});
}

function visualizerTick(timestamp: number) {
	const dt = lastTickTimestamp === 0 ? 1 / 60 : Math.min((timestamp - lastTickTimestamp) / 1000, MAX_DELTA);
	lastTickTimestamp = timestamp;

	draw(dt);

	visualizerTickFrameId = window.requestAnimationFrame(visualizerTick);
}

function startVisualizerTick() {
	if (visualizerTickFrameId != null) return;
	lastTickTimestamp = 0;
	visualizerTickFrameId = window.requestAnimationFrame(visualizerTick);
}

function stopVisualizerTick() {
	if (visualizerTickFrameId == null) return;
	window.cancelAnimationFrame(visualizerTickFrameId);
	visualizerTickFrameId = null;
	lastTickTimestamp = 0;
}

function setPlaying(playing: boolean) {
	isActuallyPlaying.value = playing;
	if (playing) {
		startVisualizerTick();
	} else {
		// 一時停止中はその時点の波形・スケールをそのまま保つ (キャンバスは最後に描いたフレームを保持する)
		stopVisualizerTick();
	}
}

function init() {
	const el = audioEl.value;
	if (el == null) return;

	audioCtx = new AudioContext();
	analyserNode = audioCtx.createAnalyser();
	analyserNode.fftSize = FFT_SIZE;
	// 平滑化はこちらで時間ベースに行うため、AnalyserNode 側は最小限にしてレスポンスを残す
	analyserNode.smoothingTimeConstant = 0.4;
	// 既定の -100〜-30dB は音楽素材に対して下が広すぎるので、実用レンジに寄せて 0-255 を使い切る
	analyserNode.minDecibels = -90;
	analyserNode.maxDecibels = -25;
	gainNode = audioCtx.createGain();
	gainNode.gain.value = props.volume;
	audioSource = audioCtx.createMediaElementSource(el);

	// ビジュアライザー用。ChannelMergerNode を挟むと未接続の入力が無音チャンネルとして残り、
	// AnalyserNode のモノラルダウンミックスで振幅が半減してしまうため、直結する
	audioSource.connect(analyserNode);
	// 再生
	audioSource.connect(gainNode).connect(audioCtx.destination);

	setupBands(audioCtx.sampleRate);
	resetAnalysis();

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
	on('playing', () => setPlaying(true));
	on('waiting', () => setPlaying(false));
	on('pause', () => setPlaying(false));
	on('ended', () => setPlaying(false));
	on('emptied', () => setPlaying(false));

	// 現在の要素の状態を取り込む (コンポーネントの準備前に再生が始まっている場合等)
	if (el.paused) {
		draw(0);
	} else {
		resumeAudioCtx();
		setPlaying(true);
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

//#region 解析
/**
 * スペクトルを帯域ごとの振幅に落とし込み、エンベロープ (波形・音圧・ビート) を更新する
 */
function analyse(dt: number) {
	if (analyserNode != null && isActuallyPlaying.value) {
		analyserNode.getByteFrequencyData(freqArray);
	} else {
		freqArray.fill(0);
	}

	// 帯域ごとの生の振幅を求める
	for (let i = 0; i < BAND_COUNT; i++) {
		let max = 0;
		let total = 0;
		for (let bin = bandStart[i]; bin < bandEnd[i]; bin++) {
			const v = freqArray[bin];
			total += v;
			if (v > max) max = v;
		}
		const binCount = bandEnd[i] - bandStart[i];
		// 最大値寄りにブレンドすると、幅の広い帯域でも細いピークが平均に埋もれず輪郭が動く
		rawLevels[i] = (max * 0.7 + (total / binCount) * 0.3) / 255;
	}

	// 隣接帯域どうしを軽くならして bin 単位のちらつきを消す (山を潰さないよう中央に強く重みを置く)
	let prev = rawLevels[0];
	let sum = 0;
	let bassSum = 0;
	let bassCount = 0;
	for (let i = 0; i < BAND_COUNT; i++) {
		const current = rawLevels[i];
		const next = i + 1 < BAND_COUNT ? rawLevels[i + 1] : current;
		const smoothed = (prev + current * 6 + next) / 8;
		rawLevels[i] = smoothed;
		prev = current;

		sum += smoothed;
		if (bandIsBass[i]) {
			bassSum += smoothed;
			bassCount++;
		}
	}

	// 無音ゲート: 自動レンジ調整は微小なノイズも最大まで引き伸ばしてしまうので、
	// フレーム全体のエネルギーが無いときは強制的に閉じる
	const frameMean = sum / BAND_COUNT;
	const gate = Math.min(Math.max((frameMean - GATE_FLOOR) / GATE_RANGE, 0), 1);

	for (let i = 0; i < BAND_COUNT; i++) {
		const normalized = adaptiveNorm(rawLevels[i], bandFloors, bandCeils, i, dt);
		// そもそも大きな音が出たことのない帯域 (ローパスされた音源の高域など) は暴れさせない
		const activity = Math.min(bandCeils[i] / ACTIVE_CEIL_REF, 1);
		const target = Math.pow(normalized, CONTRAST_EXPONENT) * activity * gate;

		levels[i] = approach(levels[i], target, target > levels[i] ? WAVE_ATTACK_TAU : WAVE_RELEASE_TAU, dt);
	}

	// 全体の音圧: 緩やかに追従させ、曲の盛り上がりに合わせてじわっと拡大縮小させる
	levelEnv = approach(levelEnv, adaptiveNorm(frameMean, aggFloors, aggCeils, 0, dt) * gate, LEVEL_TAU, dt);

	// ビート: 低域エンベロープが自身の移動平均をどれだけ超えたかで検出する
	const bass = bassCount > 0 ? adaptiveNorm(bassSum / bassCount, aggFloors, aggCeils, 1, dt) * gate : 0;
	bassEnv = approach(bassEnv, bass, bass > bassEnv ? BASS_ATTACK_TAU : BASS_RELEASE_TAU, dt);
	bassBaseline = approach(bassBaseline, bassEnv, BASS_BASELINE_TAU, dt);
	const hit = Math.min(Math.max(bassEnv - bassBaseline, 0) * BEAT_SENSITIVITY, 1);
	beatEnv = hit > beatEnv ? hit : approach(beatEnv, hit, BEAT_RELEASE_TAU, dt);
}
//#endregion

//#region 描画
/**
 * 帯域の振幅を左右対称の閉じた輪郭として塗る
 */
function fillWave(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, baseRadius: number, values: Float32Array, gain: number) {
	const total = BAND_COUNT * 2;

	for (let k = 0; k < total; k++) {
		// 前半は上→下、後半はその鏡像で下→上をたどる
		const bandIndex = k < BAND_COUNT ? k : total - 1 - k;
		const radius = baseRadius * (1 + values[bandIndex] * gain);
		// 真上を起点に、半周を BAND_COUNT 等分する (両端を半ステップずらして点の重複を避ける)
		const angle = -Math.PI / 2 + Math.PI * (k + 0.5) / BAND_COUNT;
		pointsX[k] = centerX + radius * Math.cos(angle);
		pointsY[k] = centerY + radius * Math.sin(angle);
	}

	// Catmull-Rom スプラインを 3 次ベジェに変換して描く。
	// 中点を経由する 2 次ベジェと違い曲線が頂点そのものを通るので、単独の山が潰れず尖ったまま残る
	ctx.beginPath();
	ctx.moveTo(pointsX[0], pointsY[0]);
	for (let k = 0; k < total; k++) {
		const prev = (k - 1 + total) % total;
		const next = (k + 1) % total;
		const nextNext = (k + 2) % total;
		ctx.bezierCurveTo(
			pointsX[k] + (pointsX[next] - pointsX[prev]) * SPLINE_TENSION / 6,
			pointsY[k] + (pointsY[next] - pointsY[prev]) * SPLINE_TENSION / 6,
			pointsX[next] - (pointsX[nextNext] - pointsX[k]) * SPLINE_TENSION / 6,
			pointsY[next] - (pointsY[nextNext] - pointsY[k]) * SPLINE_TENSION / 6,
			pointsX[next],
			pointsY[next],
		);
	}
	ctx.closePath();
	ctx.fill();
}

function draw(dt: number) {
	const canvas = canvasEl.value;
	const ctx = canvasCtx.value;
	if (canvas == null || ctx == null) return;

	analyse(dt);

	ctx.fillStyle = bgColor.value;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;
	// 音圧でじわっと、ビートでコツンと全体が拡大縮小する
	const scale = 1 + (levelEnv * LEVEL_SCALE + beatEnv * BEAT_SCALE) * motionDamp;
	const baseRadius = Math.min(centerX, centerY) * BASE_RADIUS_RATIO * scale;

	ctx.fillStyle = fgColor.value;
	fillWave(ctx, centerX, centerY, baseRadius, levels, WAVE_GAIN);

	if (avatarImage.value == null) return;

	// 波形の中心にアバターを円形にくりぬいて描画
	const avatarSize = baseRadius * 2 * AVATAR_RATIO;
	const avatarHeight = Math.max(avatarImage.value.height * (avatarSize / avatarImage.value.width), avatarSize);
	const avatarWidth = Math.max(avatarImage.value.width * (avatarSize / avatarImage.value.height), avatarSize);
	const avatarDx = centerX - avatarWidth / 2;
	const avatarDy = centerY - avatarHeight / 2;
	ctx.save();
	ctx.beginPath();
	ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
	ctx.clip();
	ctx.drawImage(avatarImage.value, avatarDx, avatarDy, avatarWidth, avatarHeight);
	ctx.restore();
}
//#endregion

watch(() => props.volume, (to) => {
	if (gainNode == null) return;
	gainNode.gain.value = to;
});

watch([bgColor, fgColor], () => {
	// 停止中は再描画の機会が無いので、色が変わったら自前で描き直す
	if (visualizerTickFrameId == null) draw(0);
});

watch(() => props.content.file?.user?.avatarUrl, (avatarUrl) => {
	const img = new Image();
	img.addEventListener('load', () => {
		avatarImage.value = img;
		// 停止中は再描画の機会が無いので、読み込み完了時に自前で描き直す
		if (visualizerTickFrameId == null) draw(0);
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
	background: var(--MI_THEME-panel);
}

.playIconWrapper {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
	pointer-events: none;
}

.playIcon {
	display: grid;
	place-items: center;
	width: 50px;
	height: 50px;
	border-radius: 100%;
	font-size: 120%;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	scale: 1;
	transition: scale 100ms ease;
}

// アイコン自体はクリックを受け取らないので、hoverは下のcanvas要素を経由して拾う
.visualizer:hover ~ .playIconWrapper .playIcon {
	scale: 1.2;
}
</style>
