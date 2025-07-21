<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	v-hotkey="keymap"
	tabindex="0"
	:class="[
		$style.audioContainer,
		controlsShowing && $style.active,
		(audio.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive,
	]"
	@mouseover.passive="onMouseOver"
	@mousemove.passive="onMouseMove"
	@mouseleave.passive="onMouseLeave"
	@contextmenu.stop
	@keydown.stop
>
	<button v-if="hide" :class="$style.hidden" @click="show">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="audio.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media ? ` (${i18n.ts.audio}${audio.size ? ' ' + bytes(audio.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-music"></i> {{ prefer.s.dataSaver.media && audio.size ? bytes(audio.size) : i18n.ts.audio }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>

	<div v-else-if="prefer.s.useNativeUiForVideoAudioPlayer" :class="$style.nativeAudioContainer">
		<audio
			ref="audioEl"
			preload="metadata"
			controls
			:class="$style.nativeAudio"
			@keydown.prevent
		>
			<source :src="audio.url">
		</audio>
	</div>

	<div v-else :class="$style.audioRoot">
		<audio
			ref="audioEl"
			preload="metadata"
			tabindex="-1"
			@keydown.prevent="() => {}"
		>
			<source :src="audio.url">
		</audio>
		<canvas
			ref="canvasEl"
			width="1600"
			height="900"
			:class="$style.audio"
			@keydown.prevent
			@click.self="togglePlayPause"
		></canvas>
		<button v-if="isReady && !isPlaying" class="_button" :class="$style.audioOverlayPlayButton" @click="togglePlayPause"><i class="ti ti-player-play-filled"></i></button>
		<div v-else-if="!isActuallyPlaying" :class="$style.audioLoading">
			<MkLoading/>
		</div>
		<i class="ti ti-eye-off" :class="$style.hide" @click="hide = true"></i>
		<div :class="$style.indicators">
			<div v-if="audio.comment" :class="$style.indicator">ALT</div>
			<div v-if="audio.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
		</div>
		<div :class="$style.audioControls" @click.self="togglePlayPause">
			<div :class="[$style.controlsChild, $style.controlsLeft]">
				<button class="_button" :class="$style.controlButton" @click="togglePlayPause">
					<i v-if="isPlaying" class="ti ti-player-pause-filled"></i>
					<i v-else class="ti ti-player-play-filled"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsRight]">
				<button class="_button" :class="$style.controlButton" @click="showMenu">
					<i class="ti ti-settings"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }}</div>
			<div :class="[$style.controlsChild, $style.controlsVolume]">
				<button class="_button" :class="$style.controlButton" @click="toggleMute">
					<i v-if="volume === 0" class="ti ti-volume-3"></i>
					<i v-else class="ti ti-volume"></i>
				</button>
				<MkMediaRange
					v-model="volume"
					:sliderBgWhite="true"
					:class="$style.volumeSeekbar"
				/>
			</div>
			<MkMediaRange
				v-model="rangePercent"
				:sliderBgWhite="true"
				:class="$style.seekbarRoot"
				:buffer="bufferedDataRatio"
			/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onDeactivated, onActivated, onMounted, shallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import tinycolor from 'tinycolor2';
import type { MenuItem } from '@/types/menu.js';
import type { Keymap } from '@/utility/hotkey.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard';
import bytes from '@/filters/bytes.js';
import { hms } from '@/filters/hms.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import hasAudio from '@/utility/media-has-audio.js';
import MkMediaRange from '@/components/MkMediaRange.vue';
import { $i, iAmModerator } from '@/i.js';
import { prefer } from '@/preferences.js';
import { extractAvgColorFromBlurhash } from '@@/js/extract-avg-color-from-blurhash.js';

const props = defineProps<{
	audio: Misskey.entities.DriveFile;
}>();

const keymap = {
	'up': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && audioEl.value) {
				volume.value = Math.min(volume.value + 0.1, 1);
			}
		},
	},
	'down': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && audioEl.value) {
				volume.value = Math.max(volume.value - 0.1, 0);
			}
		},
	},
	'left': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && audioEl.value) {
				audioEl.value.currentTime = Math.max(audioEl.value.currentTime - 5, 0);
			}
		},
	},
	'right': {
		allowRepeat: true,
		callback: () => {
			if (hasFocus() && audioEl.value) {
				audioEl.value.currentTime = Math.min(audioEl.value.currentTime + 5, audioEl.value.duration);
			}
		},
	},
	'space': () => {
		if (hasFocus()) {
			togglePlayPause();
		}
	},
} as const satisfies Keymap;

// PlayerElもしくはその子要素にフォーカスがあるかどうか
function hasFocus() {
	if (!playerEl.value) return false;
	return playerEl.value === window.document.activeElement || playerEl.value.contains(window.document.activeElement);
}

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref((prefer.s.nsfw === 'force' || prefer.s.dataSaver.media) ? true : (props.audio.isSensitive && prefer.s.nsfw !== 'ignore'));

async function show() {
	if (props.audio.isSensitive && prefer.s.confirmWhenRevealingSensitiveMedia) {
		const { canceled } = await os.confirm({
			type: 'question',
			text: i18n.ts.sensitiveMediaRevealConfirm,
		});
		if (canceled) return;
	}

	hide.value = false;
}

// Menu
const menuShowing = ref(false);

function showMenu(ev: MouseEvent) {
	const menu: MenuItem[] = [
		// TODO: 再生キューに追加
		{
			type: 'switch',
			text: i18n.ts._mediaControls.loop,
			icon: 'ti ti-repeat',
			ref: loop,
		},
		{
			type: 'radio',
			text: i18n.ts._mediaControls.playbackRate,
			icon: 'ti ti-clock-play',
			ref: speed,
			options: {
				'0.25x': 0.25,
				'0.5x': 0.5,
				'0.75x': 0.75,
				'1.0x': 1,
				'1.25x': 1.25,
				'1.5x': 1.5,
				'2.0x': 2,
			},
		},
		{
			type: 'divider',
		},
		{
			text: i18n.ts.hide,
			icon: 'ti ti-eye-off',
			action: () => {
				hide.value = true;
			},
		},
	];

	if (iAmModerator) {
		menu.push({
			text: props.audio.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: props.audio.isSensitive ? 'ti ti-eye' : 'ti ti-eye-exclamation',
			danger: true,
			action: () => toggleSensitive(props.audio),
		});
	}

	const details: MenuItem[] = [];
	if ($i?.id === props.audio.userId) {
		details.push({
			type: 'link',
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${props.audio.id}`,
		});
	}

	if (iAmModerator) {
		details.push({
			type: 'link',
			text: i18n.ts.moderation,
			icon: 'ti ti-photo-exclamation',
			to: `/admin/file/${props.audio.id}`,
		});
	}

	if (details.length > 0) {
		menu.push({ type: 'divider' }, ...details);
	}

	if (prefer.s.devMode) {
		menu.push({ type: 'divider' }, {
			icon: 'ti ti-hash',
			text: i18n.ts.copyFileId,
			action: () => {
				copyToClipboard(props.audio.id);
			},
		});
	}

	menuShowing.value = true;
	os.popupMenu(menu, ev.currentTarget ?? ev.target, {
		align: 'right',
		onClosing: () => {
			menuShowing.value = false;
		},
	});
}

async function toggleSensitive(file: Misskey.entities.DriveFile) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: file.isSensitive ? i18n.ts.unmarkAsSensitiveConfirm : i18n.ts.markAsSensitiveConfirm,
	});

	if (canceled) return;

	os.apiWithDialog('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	});
}

// MediaControl: Video State
const audioEl = useTemplateRef('audioEl');
const audioSource = shallowRef<MediaElementAudioSourceNode | null>(null);
const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
gainNode.gain.value = 0.25;
const playerEl = useTemplateRef('playerEl');
const isHoverring = ref(false);
const controlsShowing = computed(() => {
	if (!oncePlayed.value) return true;
	if (isHoverring.value) return true;
	if (menuShowing.value) return true;
	return false;
});
let controlStateTimer: number | null = null;

// MediaControl: Audio Visualizer
const canvasEl = useTemplateRef('canvasEl');
const canvasCtx = computed(() => {
	if (!canvasEl.value) return null;
	return canvasEl.value.getContext('2d');
});

const channelMergerNode = audioCtx.createChannelMerger(2);
const analyser = audioCtx.createAnalyser();
analyser.smoothingTimeConstant = 0.85;
analyser.fftSize = 2048;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const prevDataArray = new Uint8Array(bufferLength);

const WAVE_THRESHOLD = 50; // 波形の閾値
const EXPONENTIAL_FACTOR = 2; // 波形の伸びを調整する指数
const WAVE_REFRESH_THRESHOLD = 2; // 波形の更新間隔（フレーム数）

let visualizerTickFrameId: number | null = null;
let visualizerTickCount = 0;

const bgColor = computed(() => {
	return props.audio.user?.avatarBlurhash ? extractAvgColorFromBlurhash(props.audio.user?.avatarBlurhash) ?? '#aaa' : '#aaa';
});
const fgColor = computed(() => {
	const tcInstance = tinycolor(bgColor.value);
	if (tcInstance.isDark()) {
		return tcInstance.lighten(20).toHexString();
	} else {
		return tcInstance.darken(20).toHexString();
	}
});
const userAvatarImage = computed(() => {
	const img = new Image();
	img.src = props.audio.user?.avatarUrl ?? '/static-assets/avatar.png';
	return img;
});

function drawVisualizer() {
	if (!canvasEl.value || !canvasCtx.value || !audioEl.value || !audioSource.value) return;
	if (document.visibilityState === 'hidden') {
		if (isActuallyPlaying.value) {
			visualizerTickFrameId = window.requestAnimationFrame(drawVisualizer);
		} else {
			visualizerTickFrameId = null;
		}
		return;
	}

	visualizerTickCount++;
	const tickStep = visualizerTickCount % WAVE_REFRESH_THRESHOLD;

	canvasCtx.value.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);

	if (tickStep === 0) {
		prevDataArray.set(dataArray);
		analyser.getByteTimeDomainData(dataArray);
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

	// 波形の中心にアバターを円形にくりぬいて描画
	const avatarSize = radius;
	const avatarHeight = Math.max(userAvatarImage.value.height * (avatarSize / userAvatarImage.value.width), avatarSize);
	const avatarWidth = Math.max(userAvatarImage.value.width * (avatarSize / userAvatarImage.value.height), avatarSize);
	const avatarDx = centerX - avatarWidth / 2;
	const avatarDy = centerY - avatarHeight / 2;
	canvasCtx.value.save();
	canvasCtx.value.beginPath();
	canvasCtx.value.arc(centerX, centerY, avatarSize / 2, 0, Math.PI * 2);
	canvasCtx.value.clip();
	canvasCtx.value.drawImage(userAvatarImage.value, avatarDx, avatarDy, avatarWidth, avatarHeight);
	canvasCtx.value.restore();

	if (isActuallyPlaying.value) {
		visualizerTickFrameId = window.requestAnimationFrame(drawVisualizer);
	} else {
		visualizerTickFrameId = null;
	}
}

// MediaControl: Common State
const oncePlayed = ref(false);
const isReady = ref(false);
const isPlaying = ref(false);
const isActuallyPlaying = ref(false);
const elapsedTimeMs = ref(0);
const durationMs = ref(0);
const rangePercent = computed({
	get: () => {
		return (elapsedTimeMs.value / durationMs.value) || 0;
	},
	set: (to) => {
		if (!audioEl.value) return;
		audioEl.value.currentTime = to * durationMs.value / 1000;
	},
});
const volume = ref(.25);
const speed = ref(1);
const loop = ref(false); // TODO: ドライブファイルのフラグに置き換える
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	if (!audioEl.value) return 0;
	return bufferedEnd.value / audioEl.value.duration;
});

// MediaControl Events
function onMouseOver() {
	if (controlStateTimer) {
		window.clearTimeout(controlStateTimer);
	}
	isHoverring.value = true;

	controlStateTimer = window.setTimeout(() => {
		isHoverring.value = false;
	}, 3000);
}

function onMouseMove() {
	if (controlStateTimer) {
		window.clearTimeout(controlStateTimer);
	}
	isHoverring.value = true;
	controlStateTimer = window.setTimeout(() => {
		isHoverring.value = false;
	}, 3000);
}

function onMouseLeave() {
	if (controlStateTimer) {
		window.clearTimeout(controlStateTimer);
	}
	controlStateTimer = window.setTimeout(() => {
		isHoverring.value = false;
	}, 100);
}

function togglePlayPause() {
	if (!isReady.value || !audioEl.value) return;

	if (audioCtx.state === 'suspended') {
		audioCtx.resume().catch(err => {
			console.error('Failed to resume AudioContext:', err);
		});
	}

	if (isPlaying.value) {
		audioEl.value.pause();
		isPlaying.value = false;
	} else {
		audioEl.value.play();
		isPlaying.value = true;
		oncePlayed.value = true;
	}
}

function toggleMute() {
	if (volume.value === 0) {
		volume.value = .25;
	} else {
		volume.value = 0;
	}
}

let onceInit = false;
let mediaTickFrameId: number | null = null;
let stopAudioElWatch: () => void;

function init() {
	if (onceInit) return;
	onceInit = true;

	if (prefer.s.useNativeUiForVideoAudioPlayer) return;

	stopAudioElWatch = watch(audioEl, () => {
		if (audioEl.value) {
			audioSource.value = audioCtx.createMediaElementSource(audioEl.value);

			// Visualizer用
			audioSource.value.connect(channelMergerNode).connect(analyser);

			// Player用
			audioSource.value.connect(gainNode).connect(audioCtx.destination);

			isReady.value = true;

			function updateMediaTick() {
				if (audioEl.value) {
					try {
						bufferedEnd.value = audioEl.value.buffered.end(0);
					} catch (err) {
						bufferedEnd.value = 0;
					}

					elapsedTimeMs.value = audioEl.value.currentTime * 1000;

					if (audioEl.value.loop !== loop.value) {
						loop.value = audioEl.value.loop;
					}
				}

				mediaTickFrameId = window.requestAnimationFrame(updateMediaTick);
			}

			updateMediaTick();

			audioEl.value.addEventListener('play', () => {
				isActuallyPlaying.value = true;
			});

			audioEl.value.addEventListener('pause', () => {
				isActuallyPlaying.value = false;
				isPlaying.value = false;
			});

			audioEl.value.addEventListener('ended', () => {
				oncePlayed.value = false;
				isActuallyPlaying.value = false;
				isPlaying.value = false;
			});

			durationMs.value = audioEl.value.duration * 1000;
			audioEl.value.addEventListener('durationchange', () => {
				if (audioEl.value) {
					durationMs.value = audioEl.value.duration * 1000;
				}
			});

			// 音量制御はGainNode
			audioEl.value.volume = 1;

			hasAudio(audioEl.value).then(had => {
				if (!had && audioEl.value) {
					audioEl.value.loop = audioEl.value.muted = true;
					audioEl.value.play();
				}
			});
		}
	}, {
		immediate: true,
	});
}

watch(volume, (to) => {
	gainNode.gain.value = to;
});

watch(speed, (to) => {
	if (audioEl.value) audioEl.value.playbackRate = to;
});

watch(loop, (to) => {
	if (audioEl.value) audioEl.value.loop = to;
});

watch(isActuallyPlaying, (to) => {
	if (to) {
		if (visualizerTickFrameId) {
			window.cancelAnimationFrame(visualizerTickFrameId);
		}
		visualizerTickFrameId = window.requestAnimationFrame(drawVisualizer);
	} else {
		if (visualizerTickFrameId) {
			window.cancelAnimationFrame(visualizerTickFrameId);
			visualizerTickFrameId = null;
		}
	}
});

onMounted(() => {
	init();
});

onActivated(() => {
	init();
});

onDeactivated(() => {
	isReady.value = false;
	isPlaying.value = false;
	isActuallyPlaying.value = false;
	elapsedTimeMs.value = 0;
	durationMs.value = 0;
	bufferedEnd.value = 0;
	hide.value = (prefer.s.nsfw === 'force' || prefer.s.dataSaver.media) ? true : (props.audio.isSensitive && prefer.s.nsfw !== 'ignore');
	stopAudioElWatch();
	onceInit = false;
	if (mediaTickFrameId) {
		window.cancelAnimationFrame(mediaTickFrameId);
		mediaTickFrameId = null;
	}
	if (controlStateTimer) {
		window.clearTimeout(controlStateTimer);
		controlStateTimer = null;
	}
	if (audioSource.value) {
		audioSource.value.disconnect();
		audioSource.value = null;
	}
	if (audioCtx.state !== 'closed') {
		audioCtx.close().catch(err => {
			console.error('Failed to close AudioContext:', err);
		});
	}
});
</script>

<style lang="scss" module>
.audioContainer {
	container-type: inline-size;
	position: relative;
	overflow: clip;

	&:focus-visible {
		outline: none;
	}
}

.sensitive {
	position: relative;

	&::after {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		border-radius: inherit;
		box-shadow: inset 0 0 0 4px var(--MI_THEME-warn);
	}
}

.indicators {
	display: inline-flex;
	position: absolute;
	top: 10px;
	left: 10px;
	pointer-events: none;
	opacity: .5;
	gap: 6px;
}

.indicator {
	font-size: 0.8em;
	padding: 2px 5px;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--MI_THEME-fg);
	color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hidden {
	width: 100%;
	height: 100%;
	background: #000;
	border: none;
	outline: none;
	font: inherit;
	color: inherit;
	cursor: pointer;
	padding: 60px 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hiddenTextWrapper {
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.audioRoot {
	background: #000;
	position: relative;
	width: 100%;
	height: 100%;
	object-fit: contain;
	border-radius: var(--MI-radius);
	overflow: clip;
}

.audio {
	display: block;
	height: 100%;
	width: 100%;
}

.audioOverlayPlayButton {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%,-50%);

	opacity: 0;
	transition: opacity .4s ease-in-out;

	background: var(--MI_THEME-accent);
	color: #fff;
	padding: 1rem;
	border-radius: 99rem;

	font-size: 1.1rem;

	&:focus-visible {
		outline: none;
	}
}

.audioLoading {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.audioControls {
	display: grid;
	grid-template-areas:
		"left time . volume right"
		"seekbar seekbar seekbar seekbar seekbar";
	grid-template-columns: auto auto 1fr auto auto;
	align-items: center;
	gap: 4px 8px;

	padding: 35px 10px 10px 10px;
	background: linear-gradient(rgba(0, 0, 0, 0),rgba(0, 0, 0, .75));

	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;

	transform: translateY(100%);
	pointer-events: none;
	opacity: 0;
	transition: opacity .4s ease-in-out, transform .4s ease-in-out;
}

.active {
	.audioControls {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.audioOverlayPlayButton {
		opacity: 1;
	}
}

.controlsChild {
	display: flex;
	align-items: center;
	gap: 4px;
	color: #fff;

	.controlButton {
		padding: 6px;
		border-radius: calc(var(--MI-radius) / 2);
		transition: background-color .2s ease-in-out;
		font-size: 1.05rem;

		&:hover {
			background-color: var(--MI_THEME-accent);
		}

		&:focus-visible {
			outline: none;
		}
	}
}

.controlsLeft {
	grid-area: left;
}

.controlsRight {
	grid-area: right;
}

.controlsTime {
	grid-area: time;
	font-size: .9rem;
}

.controlsVolume {
	grid-area: volume;

	.volumeSeekbar {
		display: none;
	}
}

.seekbarRoot {
	grid-area: seekbar;
	/* ▼シークバー操作をやりやすくするためにクリックイベントが伝播されないエリアを拡張する */
	margin: -10px;
	padding: 10px;
}

@container (min-width: 500px) {
	.audioControls {
		grid-template-areas: "left seekbar time volume right";
		grid-template-columns: auto 1fr auto auto auto;
	}

	.controlsVolume {
		.volumeSeekbar {
			max-width: 90px;
			display: block;
			flex-grow: 1;
		}
	}
}

.nativeAudioContainer {
	display: flex;
	align-items: center;
	padding: 6px;
}

.nativeAudio {
	display: block;
	width: 100%;
}
</style>
