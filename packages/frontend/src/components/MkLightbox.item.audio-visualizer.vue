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
import tinycolor from 'tinycolor2';
import type { Content } from '@/components/MkLightbox.item.vue';
import { i18n } from '@/i18n.js';
import { themeManager } from '@/theme.js';
import { prefer } from '@/preferences.js';

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
const BAND_COUNT = 96;
const BASE_HALF_HEIGHT_RATIO = 0.003;

const FFT_SIZE = 4096;
const BIN_COUNT = FFT_SIZE / 2;

/** スペクトルとして取り出す周波数レンジ */
const MIN_FREQ = 20;
const MAX_FREQ = 16000;

/**
 * 低域の傾き補正の倍率。1オクターブ上がるごとにこの値を掛ける。1より大きいと高域が持ち上がる
 */
const SPECTRUM_TILT_COEFFICIENT = 1.085;

const BEAT_BAND_COUNT = 36;
const BEAT_MIN_FREQ = 30;
const BEAT_MAX_FREQ = 300;

/** 波形の立ち上がり / 立ち下がりの時定数 (s) */
const WAVE_ATTACK_TAU = 0.01;
const WAVE_RELEASE_TAU = 0.015;
/** 正規化後にかけるコントラスト強調の指数 大きいほど小さい山が引っ込み、大きい山との差が開く */
const CONTRAST_EXPONENT = 1.9;
/** キャンバス高に対する無音時の半幅と、振幅によって加わる最大半幅 */
const WAVE_GAIN_HALF_HEIGHT_RATIO = 0.3;
/** 各バーに割り当てられた横幅のうち、実際の線の幅として使う割合 (0-1) */
const BAR_THICKNESS_FACTOR = 0.5;

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

/** キャンバス高に対するアバター直径の比 */
const AVATAR_SIZE_RATIO = 0.36;
//#endregion

// アニメーション量を控えるべきかどうか（拡大縮小のみ抑制）
const motionDamp = prefer.s.animation ? 1 : 0.3;

//#region 解析の状態
const freqArray = new Uint8Array(BIN_COUNT);
/** 帯域ごとに参照する bin の範囲 */
const bandStart = new Uint16Array(BAND_COUNT);
const bandEnd = new Uint16Array(BAND_COUNT);
/** ビート検出用の低域だけを参照する bin の範囲 */
const beatBandStart = new Uint16Array(BEAT_BAND_COUNT);
const beatBandEnd = new Uint16Array(BEAT_BAND_COUNT);
/** 帯域ごとに掛ける傾き補正の倍率 */
const bandTilt = new Float32Array(BAND_COUNT);
/** 帯域ごとの生の振幅 (フレーム内の作業用) */
const rawLevels = new Float32Array(BAND_COUNT);
/** 帯域ごとの平滑化済み振幅 (0-1) */
const levels = new Float32Array(BAND_COUNT);
/** ビート検出用の低域の生の振幅 */
const beatRawLevels = new Float32Array(BEAT_BAND_COUNT);
/** 上下の輪郭の頂点座標 */
const pointsX = new Float64Array(BAND_COUNT);
const topPointsY = new Float64Array(BAND_COUNT);
const bottomPointsY = new Float64Array(BAND_COUNT);

/** 表示波形と低域ビート検出がそれぞれ追跡する自動レンジ */
type AnalysisRange = { floor: number; ceil: number };
const waveRange: AnalysisRange = { floor: 0, ceil: 0 };
const beatRange: AnalysisRange = { floor: 0, ceil: 0 };
let levelEnv = 0;
let energyEnv = 0;
let energyBaseline = 0;
let beatEnv = 0;

function getAudioVisualizerBarWidth(canvasWidth: number, barCount: number, thicknessFactor: number) {
	return (canvasWidth / barCount) * thicknessFactor;
}

/**
 * FFT の bin を帯域ごとにまとめる。低域は十分な分解能で刻めるよう、対数的に帯域を広げる
 */
function writeLogarithmicFrequencyBands(options: {
	fftSize: number;
	sampleRate: number;
	minFrequency: number;
	maxFrequency: number;
	starts: Uint16Array;
	ends: Uint16Array;
}) {
	const bandCount = options.starts.length;
	const binCount = options.fftSize / 2;
	const maxFrequency = Math.min(options.maxFrequency, options.sampleRate / 2);
	const frequencyRatio = maxFrequency / options.minFrequency;
	const toBin = (frequency: number) => frequency * options.fftSize / options.sampleRate;

	for (let i = 0; i < bandCount; i++) {
		const lowFrequency = options.minFrequency * Math.pow(frequencyRatio, i / bandCount);
		const highFrequency = options.minFrequency * Math.pow(frequencyRatio, (i + 1) / bandCount);
		const start = Math.min(Math.max(Math.floor(toBin(lowFrequency)), 0), binCount - 1);
		const end = Math.min(Math.max(Math.ceil(toBin(highFrequency)), start + 1), binCount);
		options.starts[i] = start;
		options.ends[i] = end;
	}
}

/**
 * 帯域ごとの傾き補正の倍率をかける
 */
function writeSpectrumTilt(options: {
	sampleRate: number;
	minFrequency: number;
	maxFrequency: number;
	tilt: Float32Array;
}) {
	const bandCount = options.tilt.length;
	const maxFrequency = Math.min(options.maxFrequency, options.sampleRate / 2);
	const frequencyRatio = maxFrequency / options.minFrequency;
	const pivotFrequency = Math.sqrt(options.minFrequency * maxFrequency);

	for (let i = 0; i < bandCount; i++) {
		const centerFrequency = options.minFrequency * Math.pow(frequencyRatio, (i + 0.5) / bandCount);
		options.tilt[i] = Math.pow(SPECTRUM_TILT_COEFFICIENT, Math.log2(centerFrequency / pivotFrequency));
	}
}

function writeFrequencyBandLevels(options: {
	frequencyData: Uint8Array;
	starts: Uint16Array;
	ends: Uint16Array;
	levels: Float32Array;
	/** 帯域ごとに掛ける倍率 (傾き補正が要らない用途では省略する) */
	tilt?: Float32Array;
}) {
	const bandCount = options.levels.length;

	for (let i = 0; i < bandCount; i++) {
		let max = 0;
		let total = 0;
		for (let bin = options.starts[i]; bin < options.ends[i]; bin++) {
			const value = options.frequencyData[bin];
			total += value;
			if (value > max) max = value;
		}
		const binCount = options.ends[i] - options.starts[i];
		const level = (max * 0.7 + (total / binCount) * 0.3) / 255;
		options.levels[i] = options.tilt == null ? level : Math.min(level * options.tilt[i], 1);
	}

	let previous = options.levels[0];
	let sum = 0;
	let min = 1;
	let peak = 0;
	for (let i = 0; i < bandCount; i++) {
		const current = options.levels[i];
		const next = i + 1 < bandCount ? options.levels[i + 1] : current;
		const smoothed = (previous + current * 3 + next) / 5;
		options.levels[i] = smoothed;
		previous = current;

		sum += smoothed;
		if (smoothed < min) min = smoothed;
		if (smoothed > peak) peak = smoothed;
	}

	return { min, peak, mean: sum / bandCount };
}

function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

function setupBands(sampleRate: number) {
	writeLogarithmicFrequencyBands({
		fftSize: FFT_SIZE,
		sampleRate,
		minFrequency: MIN_FREQ,
		maxFrequency: MAX_FREQ,
		starts: bandStart,
		ends: bandEnd,
	});
	writeSpectrumTilt({
		sampleRate,
		minFrequency: MIN_FREQ,
		maxFrequency: MAX_FREQ,
		tilt: bandTilt,
	});
	// ビート検出は低域を見るのが目的なので、こちらには傾き補正を掛けない
	writeLogarithmicFrequencyBands({
		fftSize: FFT_SIZE,
		sampleRate,
		minFrequency: BEAT_MIN_FREQ,
		maxFrequency: BEAT_MAX_FREQ,
		starts: beatBandStart,
		ends: beatBandEnd,
	});
}

function resetAnalysis() {
	levels.fill(0);
	waveRange.floor = 0;
	waveRange.ceil = 0;
	beatRange.floor = 0;
	beatRange.ceil = 0;
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
function updateRange(range: AnalysisRange, frameMin: number, framePeak: number, dt: number) {
	range.floor = approach(range.floor, frameMin, frameMin < range.floor ? RANGE_FLOOR_FALL_TAU : RANGE_FLOOR_RISE_TAU, dt);
	// 上限は即座に持ち上げ、ゆっくり戻す。戻り先に下限 + 最小幅を混ぜて、レンジが潰れないようにする
	range.ceil = framePeak > range.ceil ? framePeak : approach(range.ceil, Math.max(framePeak, range.floor + MIN_RANGE_SPAN), RANGE_CEIL_FALL_TAU, dt);
	return Math.max(range.ceil - range.floor, MIN_RANGE_SPAN);
}
//#endregion

const accentColorHue = tinycolor(themeManager.currentCompiledTheme!.accent).toHsl().h;

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
		// 時間ベースの平滑は analyse() 側で行うので弱めでよい
		analyserNode.smoothingTimeConstant = 0.2;
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

	// 最大値寄りの帯域値を作り、低域寄りの傾きを補正してから、隣接帯域どうしをならして山をなだらかにする
	const waveFrame = writeFrequencyBandLevels({
		frequencyData: freqArray,
		starts: bandStart,
		ends: bandEnd,
		levels: rawLevels,
		tilt: bandTilt,
	});

	// 無音ゲート: 自動レンジ調整は微小なノイズも最大まで引き伸ばしてしまうので、
	// フレーム全体のエネルギーが無いときは強制的に閉じる
	const gate = Math.min(Math.max((waveFrame.mean - GATE_FLOOR) / GATE_RANGE, 0), 1);

	const span = updateRange(waveRange, waveFrame.min, waveFrame.peak, dt);

	for (let i = 0; i < BAND_COUNT; i++) {
		const normalized = Math.min(Math.max((rawLevels[i] - waveRange.floor) / span, 0), 1);
		const target = Math.pow(normalized, CONTRAST_EXPONENT) * gate;

		levels[i] = approach(levels[i], target, target > levels[i] ? WAVE_ATTACK_TAU : WAVE_RELEASE_TAU, dt);
	}

	const beatFrame = writeFrequencyBandLevels({
		frequencyData: freqArray,
		starts: beatBandStart,
		ends: beatBandEnd,
		levels: beatRawLevels,
	});
	const beatGate = Math.min(Math.max((beatFrame.mean - GATE_FLOOR) / GATE_RANGE, 0), 1);
	const beatSpan = updateRange(beatRange, beatFrame.min, beatFrame.peak, dt);
	// 低域全体のエネルギー。音圧による拡大縮小とビート検出の両方がこれを共有する
	const energy = Math.min(Math.max((beatFrame.mean - beatRange.floor) / beatSpan, 0), 1) * beatGate;

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
 * 低域から高域までを左から右へ並べ、中央線を挟んで上下対称の縦のバーとして描く
 */
function drawBars(ctx: CanvasRenderingContext2D, width: number, height: number, centerY: number) {
	const baseHalfHeight = height * BASE_HALF_HEIGHT_RATIO;
	const gainHalfHeight = height * WAVE_GAIN_HALF_HEIGHT_RATIO;
	const cellWidth = width / levels.length;

	//ctx.beginPath();
	for (let i = 0; i < BAND_COUNT; i++) {
		const halfHeight = baseHalfHeight + levels[i] * gainHalfHeight;
		pointsX[i] = cellWidth * (i + 0.5);
		topPointsY[i] = centerY - halfHeight;
		bottomPointsY[i] = centerY + halfHeight;

		const opacity = remap(levels[i], 0, 1, 0.125, 1);
		const hue = remap(i, 0, BAND_COUNT - 1, accentColorHue - 10, accentColorHue + 10);
		ctx.globalAlpha = opacity;
		ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
		ctx.beginPath();
		ctx.moveTo(pointsX[i], topPointsY[i]);
		ctx.lineTo(pointsX[i], bottomPointsY[i]);
		ctx.stroke();
	}
	//ctx.stroke();
	ctx.globalAlpha = 1;
}

/**
 * @param dt 前フレームからの経過時間 (s) 0 を渡すと解析を進めず、現在の状態をそのまま描き直す
 */
function draw(dt: number) {
	const canvas = canvasEl.value;
	const ctx = canvasCtx.value;
	if (canvas == null || ctx == null) return;

	if (dt > 0) analyse(dt);

	ctx.fillStyle = `hsl(${accentColorHue}, ${0.8 * 100}%, ${0.05 * 100}%)`;
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;

	if (isVisualizerAvailable) {
		ctx.lineWidth = getAudioVisualizerBarWidth(canvas.width, BAND_COUNT, BAR_THICKNESS_FACTOR);
		ctx.lineCap = 'round';
		drawBars(ctx, canvas.width, canvas.height, centerY);
	}

	// アバターを円形にくりぬいて描画 (波形が出せない場合もアバターは出す)
	const avatarScaleFactor = 1 + (levelEnv * LEVEL_SCALE + beatEnv * BEAT_SCALE) * motionDamp;
	const avatar = avatarImage.value;
	const avatarSize = canvas.height * AVATAR_SIZE_RATIO * avatarScaleFactor;
	if (avatar != null) {
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
		ctx.fillStyle = `hsl(${accentColorHue}, ${0.4 * 100}%, ${0.75 * 100}%)`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${Math.round(canvas.height * 0.055)}px ${window.getComputedStyle(canvas).fontFamily}`;
		ctx.fillText(i18n.ts.cannotPreview, centerX, centerY + avatarSize / 2 + canvas.height * 0.09);
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
