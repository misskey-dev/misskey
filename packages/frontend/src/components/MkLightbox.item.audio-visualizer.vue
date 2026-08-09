<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<!-- keyを変えて要素ごと作り直すことで、AudioContextに繋いだ要素を確実に切り離す (onLoadErrorを参照) -->
	<audio
		:key="audioElKey"
		ref="audioEl"
		preload="metadata"
		:crossorigin="crossOriginMode === 'anonymous' ? 'anonymous' : undefined"
		:src="content.url"
		@loadedmetadata="onLoadedMetadata"
		@error="onLoadError"
	></audio>
	<canvas
		ref="canvasEl"
		width="1600"
		height="900"
		data-gallery-click-action="media"
		:class="$style.visualizer"
		v-bind="$attrs"
	></canvas>
	<div v-if="!isPlaying" :class="$style.playIconWrapper">
		<div :class="$style.playIcon">
			<i class="ti ti-player-play"></i>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { useTemplateRef, shallowRef, ref, computed, watch, onBeforeUnmount } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { themeManager } from '@/theme.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
import tinycolor from 'tinycolor2';
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';
import type { Content } from '@/components/MkLightbox.item.vue';

// クリック等のフォールスルーはキャンバスに渡す (ルートは全面を覆うので、その外側は背景として扱わせる)
defineOptions({
	inheritAttrs: false,
});

const props = defineProps<{
	content: Content;
	user?: Misskey.entities.User | null; // DriveFileのuserはnullになることがある。その場合に使用する所有者情報
	isPlaying: boolean;
	volume: number;
}>();

const emit = defineEmits<{
	(ev: 'loadedmetadata'): void;
}>();

const audioEl = useTemplateRef('audioEl');
const canvasEl = useTemplateRef('canvasEl');
const canvasCtx = computed(() => canvasEl.value?.getContext('2d') ?? null);

const fileUser = computed(() => props.content.file?.user ?? props.user);

//#region 描画パラメータ
// 低域しか見ないので、その範囲を十分な bin 数で刻めるよう大きめの FFT を使う (48kHz で bin 幅 ≒ 5.9Hz)
const FFT_SIZE = 8192;
const BIN_COUNT = FFT_SIZE / 2;

/** 波形の制御点数 (片側)。実際の輪郭はこれを左右にミラーした 2 倍の点で構成される */
const BAND_COUNT = 36;
/** スペクトルとして取り出す周波数レンジ。波形もビート判定もこの低域だけを見る */
const MIN_FREQ = 30;
const MAX_FREQ = 300;

/** 波形の立ち上がり / 立ち下がりの時定数 (s) */
const WAVE_ATTACK_TAU = 0.01;
const WAVE_RELEASE_TAU = 0.015;
/** 正規化後にかけるコントラスト強調の指数 大きいほど小さい山が引っ込み、大きい山との差が開く */
const CONTRAST_EXPONENT = 1.9;
/** 基準半径に対する波形の振れ幅 */
const WAVE_GAIN = 1.05;
/** Catmull-Rom スプラインの張り具合 大きいほど丸く、0 に近いほど折れ線に近づく */
const SPLINE_TENSION = 0.9;

/** 全体の音圧に追従する緩やかな拡大縮小の時定数 (s) と最大量 */
const LEVEL_TAU = 0.3;
const LEVEL_SCALE = 0.1;
/** ビート検出用のエンベロープ / その移動平均の時定数 (s) */
const BEAT_ATTACK_TAU = 0.012;
const BEAT_FALL_TAU = 0.11;
const BEAT_BASELINE_TAU = 0.7;
/** 移動平均からの超過分をビートとみなす際の増幅率と、減衰の時定数 (s) */
const BEAT_SENSITIVITY = 3;
const BEAT_RELEASE_TAU = 0.18;
/** ビートに合わせて瞬間的に拡大する量 */
const BEAT_SCALE = 0.16;

/** キャンバス短辺の半分に対する、無音時の波形半径の比 (アバターの直径もこれに一致する) */
const BASE_RADIUS_RATIO = 0.36;
//#endregion

// アニメーション量を控えるべきかどうか（拡大縮小のみ抑制）
const motionDamp = prefer.s.animation ? 1 : 0.3;

//#region 解析の状態
const freqArray = new Uint8Array(BIN_COUNT);
/** 帯域ごとに参照する bin の範囲 */
const bandStart = new Uint16Array(BAND_COUNT);
const bandEnd = new Uint16Array(BAND_COUNT);
/** 帯域ごとの生の振幅 (フレーム内の作業用) */
const rawLevels = new Float32Array(BAND_COUNT);
/** 帯域ごとの平滑化済み振幅 (0-1) */
const levels = new Float32Array(BAND_COUNT);
/** 輪郭の頂点座標 */
const pointsX = new Float64Array(BAND_COUNT * 2);
const pointsY = new Float64Array(BAND_COUNT * 2);

/** 自動レンジ調整が追跡している下限 / 上限。低域だけを見るので全帯域で 1 つのレンジを共有する */
let rangeFloor = 0;
let rangeCeil = 0;
let levelEnv = 0;
let energyEnv = 0;
let energyBaseline = 0;
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
	}
}

function resetAnalysis() {
	levels.fill(0);
	rangeFloor = 0;
	rangeCeil = 0;
	levelEnv = 0;
	energyEnv = 0;
	energyBaseline = 0;
	beatEnv = 0;
}

/**
 * 指数平滑。フレームレートに依存しないよう、経過時間から係数を求める
 * @param tau 目標値の約 63% まで近づくのにかかる秒数
 */
function approach(current: number, target: number, tau: number, dt: number) {
	return current + (target - current) * (1 - Math.exp(-dt / tau));
}

/** 下限が下がる / 上がるときの時定数 (s) 上げ側を遅くして、鳴っている間に基準が持ち上がらないようにする */
const RANGE_FLOOR_FALL_TAU = 0.25;
const RANGE_FLOOR_RISE_TAU = 4;
/** 上限が下がるときの時定数 (s) 上がるときは即時 */
const RANGE_CEIL_FALL_TAU = 1.4;
/** レンジ幅の下限。これ以下に潰れたときに無理な増幅をしない */
const MIN_RANGE_SPAN = 0.14;

/**
 * フレーム内の最小 / 最大値から、正規化に使うレンジを更新して幅を返す (自動レンジ調整)。
 * 音源ごとの音量差を吸収しつつ、下限をゆっくり、上限を即時に追従させて短時間のダイナミクスは残す
 */
function updateRange(frameMin: number, framePeak: number, dt: number) {
	rangeFloor = approach(rangeFloor, frameMin, frameMin < rangeFloor ? RANGE_FLOOR_FALL_TAU : RANGE_FLOOR_RISE_TAU, dt);
	// 上限は即座に持ち上げ、ゆっくり戻す。戻り先に下限 + 最小幅を混ぜて、レンジが潰れないようにする
	rangeCeil = framePeak > rangeCeil ? framePeak : approach(rangeCeil, Math.max(framePeak, rangeFloor + MIN_RANGE_SPAN), RANGE_CEIL_FALL_TAU, dt);
	return Math.max(rangeCeil - rangeFloor, MIN_RANGE_SPAN);
}
//#endregion

const defaultBgColor = themeManager.currentCompiledTheme?.accent ?? '#aaa';
const accentColorHue = computed(() => tinycolor(fileUser.value?.avatarBlurhash ? extractAvgColorFromBlurhash(fileUser.value.avatarBlurhash) ?? defaultBgColor : defaultBgColor).toHsl().h);
const bgColor = computed(() => {
	let targetLightness, targetSaturation;
	if (store.r.darkMode.value) {
		targetLightness = 0.1;
		targetSaturation = 0.8;
	} else {
		targetLightness = 0.9;
		targetSaturation = 0.9;
	}
	return `hsl(${accentColorHue.value}, ${targetSaturation * 100}%, ${targetLightness * 100}%)`;
});
const fgColor = computed(() => {
	let targetLightness, targetSaturation;
	if (store.r.darkMode.value) {
		targetLightness = 0.25;
		targetSaturation = 0.8;
	} else {
		targetLightness = 0.7;
		targetSaturation = 0.7;
	}
	return `hsl(${accentColorHue.value}, ${targetSaturation * 100}%, ${targetLightness * 100}%)`;
});
const messageColor = computed(() => {
	let targetLightness, targetSaturation;
	if (store.r.darkMode.value) {
		targetLightness = 0.75;
		targetSaturation = 0.4;
	} else {
		targetLightness = 0.25;
		targetSaturation = 0.4;
	}
	return `hsl(${accentColorHue.value}, ${targetSaturation * 100}%, ${targetLightness * 100}%)`;
});

// 読み込みが終わるまでは描画しない (読み込み完了時の描き直しは下のwatchで行う)
const avatarImage = shallowRef<HTMLImageElement | null>(null);

//#region audio graph
let audioCtx: AudioContext | null = null;
let audioSource: MediaElementAudioSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let gainNode: GainNode | null = null;
let abortController: AbortController | null = null;

/** 解析用のオーディオグラフを組めたかどうか。組めなかった場合は波形の代わりに文言を出す */
let isVisualizerAvailable = true;

// AnalyserNodeはCORS的に読めない音源に対して無音を返すが、その際に例外もイベントも発生しない。
// しかも一度 createMediaElementSource() に渡した要素は元の出力に戻せないため、
// 「読み込み方を先に決める」「駄目なら要素ごと作り直す」の二段構えにする
function isSameOrigin(url: string) {
	try {
		return new URL(url, window.location.href).origin === window.location.origin;
	} catch {
		return false;
	}
}

/** 同一オリジンの音源はCORS属性なしでも解析できる */
const isSameOriginContent = computed(() => isSameOrigin(props.content.url));
/** CORS付きでの読み込みに失敗した音源 */
const corsFailedUrl = ref<string | null>(null);
/** フォールバックで要素を作り直した後、再生を再開すべき音源 */
let resumeAfterReloadUrl: string | null = null;

/** `anonymous`: CORS付きで読み込む (解析できる) / `none`: CORS無しで読み込む (同一オリジンでない場合は再生のみ) */
const crossOriginMode = computed<'anonymous' | 'none'>(() => (isSameOriginContent.value || corsFailedUrl.value === props.content.url) ? 'none' : 'anonymous');
const canUseAudioGraph = computed(() => isSameOriginContent.value || crossOriginMode.value === 'anonymous');

// 読み込み方が変わったときと音源が差し替わったときに<audio>を作り直す。
// 同じ要素を2度 createMediaElementSource() に渡すことはできないので、
// グラフの組み直しが要る場面では必ず新しい要素を用意する必要がある
const audioElKey = computed(() => `${crossOriginMode.value}\n${props.content.url}`);

/** 現在の要素でメタデータまで到達できたか。到達していればCORSのチェックは通過している */
let hasLoadedMetadata = false;
/** 現在の要素に対して再生が要求されたか */
let isPlayRequested = false;

function onLoadedMetadata() {
	hasLoadedMetadata = true;
	emit('loadedmetadata');
}

function onLoadError() {
	// CORSヘッダを返さないサーバーでは crossorigin 付きの読み込みが失敗するが、
	// MediaErrorからは原因を判別できないので、理由を問わず一度だけCORS無しで読み直す
	// (本当に壊れているファイルなら再試行も失敗し、同じエラー状態に落ち着く)。
	// ただしメタデータまで読めていたならCORSは通過済みなので、再生中のネットワーク断や
	// デコード失敗を拾ってフォールバックしてしまわないようにする
	if (crossOriginMode.value !== 'anonymous' || hasLoadedMetadata) return;

	// 読み込み前に失敗しているので再生位置は0のまま。再生の要求だけ引き継げばよい
	resumeAfterReloadUrl = isPlayRequested ? props.content.url : null;
	corsFailedUrl.value = props.content.url;
}

let visualizerTickFrameId: number | null = null;
let lastTickTimestamp = 0;

function resumeAudioCtx() {
	if (audioCtx == null || audioCtx.state !== 'suspended') return;
	audioCtx.resume().catch(err => {
		console.error('Failed to resume AudioContext:', err);
	});
}

function visualizerTick(timestamp: number) {
	// タブがバックグラウンドに回っている間は rAF が止まるので、復帰時の巨大な dt は 0.1s で頭打ちにする
	const dt = lastTickTimestamp === 0 ? 1 / 60 : Math.min((timestamp - lastTickTimestamp) / 1000, 0.1);
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
	if (playing && isVisualizerAvailable) {
		startVisualizerTick();
	} else {
		// 一時停止中はその時点の波形・スケールをそのまま保つ (キャンバスは最後に描いたフレームを保持する)
		stopVisualizerTick();
	}
}

/**
 * 解析用のオーディオグラフを組む。組めなかった場合は false を返す
 * (AudioContext を作れない環境や、要素が既に別の AudioContext に接続済みの場合など)
 */
function setupAudioGraph(el: HTMLAudioElement) {
	try {
		audioCtx = new AudioContext();
		analyserNode = audioCtx.createAnalyser();
		analyserNode.fftSize = FFT_SIZE;
		// FFT の窓自体が長く (≒ 170ms) 平滑がかかるうえ、時間ベースの平滑は analyse() 側で行うので弱めにする
		analyserNode.smoothingTimeConstant = 0.3;
		// 既定の -100〜-30dB は音楽素材に対して下が広すぎるので、実用レンジに寄せて 0-255 を使い切る
		analyserNode.minDecibels = -90;
		analyserNode.maxDecibels = -25;
		gainNode = audioCtx.createGain();
		gainNode.gain.value = props.volume;
		audioSource = audioCtx.createMediaElementSource(el);

		// ビジュアライザー用 (解析するだけなので destination には繋がない)
		audioSource.connect(analyserNode);
		// 再生用
		audioSource.connect(gainNode).connect(audioCtx.destination);

		setupBands(audioCtx.sampleRate);
		return true;
	} catch (err) {
		console.error('Failed to set up the audio graph for the visualizer:', err);
		teardownAudioGraph();
		return false;
	}
}

function init() {
	const el = audioEl.value;
	if (el == null) return;

	// 前の音源の波形を持ち越さない
	resetAnalysis();

	// CORS的に読めない音源をグラフに繋ぐと再生まで無音になるため、その場合は繋がずに素の再生に任せる
	isVisualizerAvailable = canUseAudioGraph.value && setupAudioGraph(el);

	if (isVisualizerAvailable) {
		// 音量制御はGainNodeが担当するため、要素側は常に100%
		// (ミュートは音量0として表現する。要素をmutedにするとタップまで無音になり波形が消える)
		el.volume = 1;
	} else {
		// グラフを組めなかったときは要素側で音量を制御する (ビジュアライザは諦めるが再生はできる)
		el.volume = props.volume;
	}
	el.muted = false;

	abortController = new AbortController();
	const signal = abortController.signal;

	const on = (type: keyof HTMLMediaElementEventMap, listener: () => void) => {
		el.addEventListener(type, listener, { signal });
	};

	// 再生状態: メディア要素のイベントを唯一の情報源にすることで、このコンポーネント経由でない
	// 操作 (コントロール・キーボード・OSのメディアキー等) でも波形の描画と同期がとれる
	on('play', () => {
		isPlayRequested = true;
		resumeAudioCtx();
	});
	on('playing', () => setPlaying(true));
	on('waiting', () => setPlaying(false));
	on('pause', () => setPlaying(false));
	on('ended', () => setPlaying(false));
	on('emptied', () => setPlaying(false));

	// 現在の要素の状態を取り込む (コンポーネントの準備前に再生が始まっている場合等)。
	if (!el.paused) resumeAudioCtx();
	setPlaying(!el.paused);

	// フォールバックでaudio要素を作り直す前に再生が要求されていたなら、新しい要素で再生し直す
	if (resumeAfterReloadUrl === props.content.url) {
		resumeAfterReloadUrl = null;
		el.play().catch(err => {
			if (_DEV_) console.warn('Failed to play media:', err);
		});
	}

	// 波形が回らないケース (停止中、またはビジュアライザを描画できない場合) はここで一度だけ描く
	redrawIfStopped();
}

function teardownAudioGraph() {
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

function teardown() {
	abortController?.abort();
	abortController = null;
	stopVisualizerTick();
	teardownAudioGraph();
	isVisualizerAvailable = true;
	hasLoadedMetadata = false;
	isPlayRequested = false;
}
//#endregion

//#region 解析
/** 無音ゲート フレーム平均がこの下限からこの幅の間で 0→1 になる */
const GATE_FLOOR = 0.02;
const GATE_RANGE = 0.08;

/**
 * スペクトルを帯域ごとの振幅に落とし込み、エンベロープ (波形・音圧・ビート) を更新する
 */
function analyse(dt: number) {
	if (analyserNode == null) return;
	analyserNode.getByteFrequencyData(freqArray);

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

	// 隣接帯域どうしをならして山をなだらかにする
	let prev = rawLevels[0];
	let sum = 0;
	let frameMin = 1;
	let framePeak = 0;
	for (let i = 0; i < BAND_COUNT; i++) {
		const current = rawLevels[i];
		const next = i + 1 < BAND_COUNT ? rawLevels[i + 1] : current;
		const smoothed = (prev + current * 3 + next) / 5;
		rawLevels[i] = smoothed;
		prev = current;

		sum += smoothed;
		if (smoothed < frameMin) frameMin = smoothed;
		if (smoothed > framePeak) framePeak = smoothed;
	}

	// 無音ゲート: 自動レンジ調整は微小なノイズも最大まで引き伸ばしてしまうので、
	// フレーム全体のエネルギーが無いときは強制的に閉じる
	const frameMean = sum / BAND_COUNT;
	const gate = Math.min(Math.max((frameMean - GATE_FLOOR) / GATE_RANGE, 0), 1);

	const span = updateRange(frameMin, framePeak, dt);

	for (let i = 0; i < BAND_COUNT; i++) {
		const normalized = Math.min(Math.max((rawLevels[i] - rangeFloor) / span, 0), 1);
		const target = Math.pow(normalized, CONTRAST_EXPONENT) * gate;

		levels[i] = approach(levels[i], target, target > levels[i] ? WAVE_ATTACK_TAU : WAVE_RELEASE_TAU, dt);
	}

	// 低域全体のエネルギー。音圧による拡大縮小とビート検出の両方がこれを共有する
	const energy = Math.min(Math.max((frameMean - rangeFloor) / span, 0), 1) * gate;

	// 全体の音圧: 緩やかに追従させ、曲の盛り上がりに合わせてじわっと拡大縮小させる
	levelEnv = approach(levelEnv, energy, LEVEL_TAU, dt);

	// ビート: エネルギーが自身の移動平均をどれだけ超えたかで検出する
	energyEnv = approach(energyEnv, energy, energy > energyEnv ? BEAT_ATTACK_TAU : BEAT_FALL_TAU, dt);
	energyBaseline = approach(energyBaseline, energyEnv, BEAT_BASELINE_TAU, dt);
	const hit = Math.min(Math.max(energyEnv - energyBaseline, 0) * BEAT_SENSITIVITY, 1);
	beatEnv = hit > beatEnv ? hit : approach(beatEnv, hit, BEAT_RELEASE_TAU, dt);
}
//#endregion

//#region 描画
/**
 * 帯域の振幅を左右対称の閉じた輪郭として塗る
 */
function fillWave(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, baseRadius: number) {
	const total = BAND_COUNT * 2;

	for (let k = 0; k < total; k++) {
		// 前半は上→下、後半はその鏡像で下→上をたどる
		const bandIndex = k < BAND_COUNT ? k : total - 1 - k;
		const radius = baseRadius * (1 + levels[bandIndex] * WAVE_GAIN);
		// 真上を起点に、半周を BAND_COUNT 等分する (両端を半ステップずらして点の重複を避ける)
		const angle = -Math.PI / 2 + Math.PI * (k + 0.5) / BAND_COUNT;
		pointsX[k] = centerX + radius * Math.cos(angle);
		pointsY[k] = centerY + radius * Math.sin(angle);
	}

	// Catmull-Rom スプラインを 3 次ベジェに変換して描く (曲線が頂点そのものを通るので、単独の山が潰れない)
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

/**
 * @param dt 前フレームからの経過時間 (s) 0 を渡すと解析を進めず、現在の状態をそのまま描き直す
 */
function draw(dt: number) {
	const canvas = canvasEl.value;
	const ctx = canvasCtx.value;
	if (canvas == null || ctx == null) return;

	if (dt > 0) analyse(dt);

	ctx.fillStyle = bgColor.value;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;

	// 全体が拡大縮小する
	// (ビジュアライザを描画できない場合は解析が走らずエンベロープが 0 のままなので、自然に等倍になる)
	const scale = 1 + (levelEnv * LEVEL_SCALE + beatEnv * BEAT_SCALE) * motionDamp;
	const baseRadius = Math.min(centerX, centerY) * BASE_RADIUS_RATIO * scale;

	if (isVisualizerAvailable) {
		ctx.fillStyle = fgColor.value;
		fillWave(ctx, centerX, centerY, baseRadius);
	}

	// 波形の中心にアバターを円形にくりぬいて描画 (波形が出せない場合もアバターは出す)
	const avatar = avatarImage.value;
	if (avatar != null) {
		const avatarSize = baseRadius * 2;
		const avatarHeight = Math.max(avatar.height * (avatarSize / avatar.width), avatarSize);
		const avatarWidth = Math.max(avatar.width * (avatarSize / avatar.height), avatarSize);
		ctx.save();
		ctx.beginPath();
		ctx.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
		ctx.clip();
		ctx.drawImage(avatar, centerX - avatarWidth / 2, centerY - avatarHeight / 2, avatarWidth, avatarHeight);
		ctx.restore();
	}

	if (!isVisualizerAvailable) {
		// 再生自体はできるので、アバターの下に文言を添えるだけに留める
		ctx.fillStyle = messageColor.value;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${Math.round(canvas.height * 0.055)}px ${window.getComputedStyle(canvas).fontFamily}`;
		ctx.fillText(i18n.ts.cannotPreview, centerX, centerY + baseRadius + canvas.height * 0.09);
	}
}

/** 停止中は描画の機会が無いので、表示内容が変わったときに自前で描き直す */
function redrawIfStopped() {
	if (visualizerTickFrameId == null) draw(0);
}
//#endregion

watch(() => props.volume, (to) => {
	if (gainNode != null) {
		gainNode.gain.value = to;
	} else if (audioEl.value != null) {
		// グラフを組めなかったときの音量制御は要素側が担当する
		audioEl.value.volume = to;
	}
});

watch([bgColor, fgColor], redrawIfStopped);

watch(() => fileUser.value?.avatarUrl, (avatarUrl) => {
		const img = new Image();
	img.addEventListener('load', () => {
		avatarImage.value = img;
		redrawIfStopped();
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
