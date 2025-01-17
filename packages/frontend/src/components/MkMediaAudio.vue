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
		(audio.isSensitive && defaultStore.state.highlightSensitiveMedia) && $style.sensitive,
	]"
	@contextmenu.stop
	@keydown.stop
>
	<button v-if="hide" :class="$style.hidden" @click="showHiddenContent">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="audio.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.dataSaver.media ? ` (${i18n.ts.audio}${audio.size ? ' ' + bytes(audio.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-music"></i> {{ defaultStore.state.dataSaver.media && audio.size ? bytes(audio.size) : i18n.ts.audio }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>

	<div v-else-if="defaultStore.reactiveState.useNativeUIForVideoAudioPlayer.value" :class="$style.nativeAudioContainer">
		<audio
			ref="audioEl"
			preload="metadata"
			crossorigin="anonymous"
			controls
			:class="$style.nativeAudio"
			@keydown.prevent
		>
			<source :src="audio.url">
		</audio>
	</div>

	<div v-else>
		<MkAudioVisualizer v-if="user" ref="audioVisualizer" :audioEl="audioEl" :analyser="analyserNode" :user="user" :profileImage="user.avatarUrl"/>
		<div :class="$style.audioControls">
			<audio
				ref="audioEl"
				preload="metadata"
				crossorigin="anonymous"
			>
				<source :src="audio.url">
			</audio>
			<div :class="[$style.controlsChild, $style.controlsLeft]">
				<button class="_button" :class="$style.controlButton" @click.prevent.stop="togglePlayPause">
					<i v-if="isPlaying" class="ti ti-player-pause-filled"></i>
					<i v-else class="ti ti-player-play-filled"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsRight]">
				<button class="_button" :class="$style.controlButton" @click.prevent.stop="showMenu">
					<i class="ti ti-settings"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }}</div>
			<div :class="[$style.controlsChild, $style.controlsVolume]">
				<button class="_button" :class="$style.controlButton" @click.prevent.stop="toggleMute">
					<i v-if="volume === 0" class="ti ti-volume-3"></i>
					<i v-else class="ti ti-volume"></i>
				</button>
				<MkMediaRange
					v-model="volume"
					:class="$style.volumeSeekbar"
				/>
			</div>
			<MkMediaRange
				v-model="rangePercent"
				:class="$style.seekbarRoot"
				:buffer="bufferedDataRatio"
			/>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { shallowRef, watch, computed, ref, onDeactivated, onActivated, onMounted, defineAsyncComponent } from 'vue';
import * as Misskey from 'misskey-js';
import type { MenuItem } from '@/types/menu.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import bytes from '@/filters/bytes.js';
import { hms } from '@/filters/hms.js';
import MkMediaRange from '@/components/MkMediaRange.vue';
import { pleaseLogin } from '@/scripts/please-login.js';
import { $i, iAmModerator } from '@/account.js';

const MkAudioVisualizer = defineAsyncComponent(() => import('@/components/MkAudioVisualizer.vue'));
const props = defineProps<{
	audio: Misskey.entities.DriveFile;
	user?: Misskey.entities.UserLite;
}>();

const keymap = {
	'up': () => {
		if (hasFocus() && audioEl.value) {
			volume.value = Math.min(volume.value + 0.1, 1);
		}
	},
	'down': () => {
		if (hasFocus() && audioEl.value) {
			volume.value = Math.max(volume.value - 0.1, 0);
		}
	},
	'left': () => {
		if (hasFocus() && audioEl.value) {
			audioEl.value.currentTime = Math.max(audioEl.value.currentTime - 5, 0);
		}
	},
	'right': () => {
		if (hasFocus() && audioEl.value) {
			audioEl.value.currentTime = Math.min(audioEl.value.currentTime + 5, audioEl.value.duration);
		}
	},
	'space': () => {
		if (hasFocus()) {
			togglePlayPause();
		}
	},
};

// PlayerElもしくはその子要素にフォーカスがあるかどうか
function hasFocus() {
	if (!playerEl.value) return false;
	return playerEl.value === document.activeElement || playerEl.value.contains(document.activeElement);
}

const playerEl = shallowRef<HTMLDivElement>();
const audioEl = shallowRef<HTMLAudioElement>();
const audioVisualizer = ref<InstanceType<typeof MkAudioVisualizer>>();

// eslint-disable-next-line vue/no-setup-props-destructure
const hide = ref((defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.audio.isSensitive && defaultStore.state.nsfw !== 'ignore'));

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

	if ($i?.id === props.audio.userId || iAmModerator) {
		menu.push({
			type: 'divider',
		});
	}

	if (iAmModerator) {
		menu.push({
			text: props.audio.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
			icon: props.audio.isSensitive ? 'ti ti-eye' : 'ti ti-eye-exclamation',
			danger: true,
			action: () => toggleSensitive(props.audio),
		});

		if ($i?.id !== props.audio.userId) {
			menu.push({
				type: 'link' as const,
				text: i18n.ts._fileViewer.title,
				icon: 'ti ti-info-circle',
				to: `/admin/file/${props.audio.id}`,
			});
		}
	}

	if ($i?.id === props.audio.userId) {
		menu.push({
			type: 'link' as const,
			text: i18n.ts._fileViewer.title,
			icon: 'ti ti-info-circle',
			to: `/my/drive/file/${props.audio.id}`,
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

function showHiddenContent(ev: MouseEvent) {
	if (props.audio.isSensitive && !$i) {
		ev.preventDefault();
		ev.stopPropagation();
		pleaseLogin();
		return;
	}

	if (hide.value) {
		ev.preventDefault();
		ev.stopPropagation();
		hide.value = false;
	}
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	os.apiWithDialog('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	});
}

// MediaControl: Common State
const oncePlayed = ref(false);
const isReady = ref(false);
const isPlaying = ref(false);
const isActuallyPlaying = ref(false);
const elapsedTimeMs = ref(0);
const durationMs = ref(0);
const audioContext = ref<AudioContext | null>(null);
const sourceNode = ref<MediaElementAudioSourceNode | null>(null);
const gainNode = ref<GainNode | null>(null);
const analyserGainNode = ref<GainNode | null>(null);
const analyserNode = ref<AnalyserNode | null>(null);
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
function togglePlayPause() {
	if (!isReady.value || !audioEl.value) return;

	if (!sourceNode.value) {
		audioContext.value = new (window.AudioContext || window.webkitAudioContext)();
		sourceNode.value = audioContext.value.createMediaElementSource(audioEl.value);

		analyserGainNode.value = audioContext.value.createGain();
		gainNode.value = audioContext.value.createGain();
		analyserNode.value = audioContext.value.createAnalyser();

		sourceNode.value.connect(analyserGainNode.value);
		analyserGainNode.value.connect(analyserNode.value);
		analyserNode.value.connect(gainNode.value);
		gainNode.value.connect(audioContext.value.destination);

		analyserNode.value.fftSize = 2048;

		analyserGainNode.value.gain.setValueAtTime(0.8, audioContext.value.currentTime);

		gainNode.value.gain.setValueAtTime(volume.value, audioContext.value.currentTime);
	}

	if (isPlaying.value) {
		audioEl.value.pause();
		audioVisualizer.value?.pauseAnimation();
		isPlaying.value = false;
	} else {
		audioEl.value.play();
		audioVisualizer.value?.resumeAnimation();
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

	stopAudioElWatch = watch(audioEl, () => {
		if (audioEl.value) {
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
				audioVisualizer.value?.pauseAnimation();
			});

			durationMs.value = audioEl.value.duration * 1000;
			audioEl.value.addEventListener('durationchange', () => {
				if (audioEl.value) {
					durationMs.value = audioEl.value.duration * 1000;
				}
			});
			gainNode.value?.gain.setValueAtTime(volume.value, audioContext.value?.currentTime);
		}
	}, {
		immediate: true,
	});
}

watch(volume, (to) => {
	if (audioEl.value) gainNode.value?.gain.setValueAtTime(to, audioContext.value?.currentTime);
});

watch(speed, (to) => {
	if (audioEl.value) audioEl.value.playbackRate = to;
});

watch(loop, (to) => {
	if (audioEl.value) audioEl.value.loop = to;
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
	hide.value = (defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.audio.isSensitive && defaultStore.state.nsfw !== 'ignore');
	stopAudioElWatch();
	onceInit = false;
	if (mediaTickFrameId) {
		window.cancelAnimationFrame(mediaTickFrameId);
		mediaTickFrameId = null;
	}
});
</script>

<style lang="scss" module>
.audioContainer {
	container-type: inline-size;
	position: relative;
	border: .5px solid var(--divider);
	border-radius: var(--radius);
	overflow: clip;

	&:focus {
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
		box-shadow: inset 0 0 0 4px var(--warn);
	}
}

.hidden {
	width: 100%;
	background: #000;
	border: none;
	outline: none;
	font: inherit;
	color: inherit;
	cursor: pointer;
	padding: 12px 0;
	display: flex;
	align-items: center;
	justify-content: center;
}

.hiddenTextWrapper {
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.audioControls {
	display: grid;
	grid-template-areas:
		"left time . volume right"
		"seekbar seekbar seekbar seekbar seekbar";
	grid-template-columns: auto auto 1fr auto auto;
	align-items: center;
	gap: 4px 8px;
	padding: 10px;
}

.controlsChild {
	display: flex;
	align-items: center;
	gap: 4px;

	.controlButton {
		padding: 6px;
		border-radius: calc(var(--radius) / 2);
		font-size: 1.05rem;

		&:hover {
			color: var(--accent);
			background-color: var(--accentedBg);
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
