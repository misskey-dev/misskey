<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<div :class="[$style.seekbar]">
		<MkMediaRange
			v-model="rangePercent"
			:buffer="bufferedDataRatio"
		/>
	</div>

	<div :class="[$style.controlsChild, $style.controlsLeft]">
		<button class="_button" :class="$style.controlButton" @click="togglePlayPause">
			<i v-if="isPlaying" class="ti ti-player-pause"></i>
			<i v-else class="ti ti-player-play"></i>
		</button>

		<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }} / {{ hms(durationMs) }}</div>
	</div>
	<div :class="[$style.controlsChild, $style.controlsCenter]">
	</div>
	<div :class="[$style.controlsChild, $style.controlsRight]">
		<button class="_button" :class="$style.controlButton" @click="toggleMute">
			<i v-if="volume === 0" class="ti ti-volume-3"></i>
			<i v-else class="ti ti-volume"></i>
		</button>
		<MkMediaRange
			v-model="volume"
			:class="$style.volumeSeekbar"
		/>
		<button class="_button" :class="$style.controlButton" @click="showMenu">
			<i class="ti ti-settings"></i>
		</button>
		<button class="_button" :class="$style.controlButton" @click="toggleFullscreen">
			<i v-if="isFullscreen" class="ti ti-arrows-minimize"></i>
			<i v-else class="ti ti-arrows-maximize"></i>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onActivated, onMounted } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { hms } from '@/filters/hms.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import hasAudio from '@/utility/media-has-audio.js';
import MkMediaRange from '@/components/MkMediaRange.vue';

const props = defineProps<{
	videoEl: HTMLVideoElement;
}>();

// Menu
const menuShowing = ref(false);

function showMenu(ev: PointerEvent) {
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
			options: [{
				label: '0.25x',
				value: 0.25,
			}, {
				label: '0.5x',
				value: 0.5,
			}, {
				label: '0.75x',
				value: 0.75,
			}, {
				label: '1.0x',
				value: 1,
			}, {
				label: '1.25x',
				value: 1.25,
			}, {
				label: '1.5x',
				value: 1.5,
			}, {
				label: '2.0x',
				value: 2,
			}],
		},
		...(window.document.pictureInPictureEnabled ? [{
			text: i18n.ts._mediaControls.pip,
			icon: 'ti ti-picture-in-picture',
			action: togglePictureInPicture,
		}] : []),
	];

	menuShowing.value = true;
	os.popupMenu(menu, ev.currentTarget ?? ev.target, {
		align: 'right',
		onClosing: () => {
			menuShowing.value = false;
		},
	});
}

// MediaControl: Video State
const isHoverring = ref(false);
const isFullscreen = ref(false);
let controlStateTimer: number | null = null;

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
		props.videoEl.currentTime = to * durationMs.value / 1000;
	},
});
const volume = ref(.25);
const speed = ref(1);
const loop = ref(false); // TODO: ドライブファイルのフラグに置き換える
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	return bufferedEnd.value / props.videoEl.duration;
});

function togglePlayPause() {
	if (!isReady.value) return;

	if (isPlaying.value) {
		props.videoEl.pause();
		isPlaying.value = false;
	} else {
		props.videoEl.play();
		isPlaying.value = true;
		oncePlayed.value = true;
	}
}

function toggleFullscreen() {
}

function togglePictureInPicture() {
	if (window.document.pictureInPictureElement) {
		window.document.exitPictureInPicture();
	} else {
		props.videoEl.requestPictureInPicture();
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
let stopVideoElWatch: () => void;

function init() {
	if (onceInit) return;
	onceInit = true;

	isReady.value = true;

	function updateMediaTick() {
		try {
			bufferedEnd.value = props.videoEl.buffered.end(0);
		} catch (err) {
			bufferedEnd.value = 0;
		}

		elapsedTimeMs.value = props.videoEl.currentTime * 1000;

		if (props.videoEl.loop !== loop.value) {
			loop.value = props.videoEl.loop;
		}
		mediaTickFrameId = window.requestAnimationFrame(updateMediaTick);
	}

	updateMediaTick();

	props.videoEl.addEventListener('play', () => {
		isActuallyPlaying.value = true;
	});

	props.videoEl.addEventListener('pause', () => {
		isActuallyPlaying.value = false;
		isPlaying.value = false;
	});

	props.videoEl.addEventListener('ended', () => {
		oncePlayed.value = false;
		isActuallyPlaying.value = false;
		isPlaying.value = false;
	});

	durationMs.value = props.videoEl.duration * 1000;
	props.videoEl.addEventListener('durationchange', () => {
		durationMs.value = props.videoEl.duration * 1000;
	});

	props.videoEl.volume = volume.value;
	hasAudio(props.videoEl).then(had => {
		if (!had) {
			props.videoEl.loop = props.videoEl.muted = true;
			props.videoEl.play();
		}
	});
}

watch(volume, (to) => {
	props.videoEl.volume = to;
});

watch(speed, (to) => {
	props.videoEl.playbackRate = to;
});

watch(loop, (to) => {
	props.videoEl.loop = to;
});

onMounted(() => {
	init();
});

onActivated(() => {
	init();
});

</script>

<style lang="scss" module>
.root {
	display: grid;
	grid-template-areas:
		"seekbar seekbar seekbar"
		"left center right";
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 4px 8px;
	width: 100%;
}

.controlsChild {
	display: flex;
	align-items: center;
	gap: 4px;

	.controlButton {
		padding: 6px;
		border-radius: calc(var(--MI-radius) / 2);
		transition: background-color .15s ease;
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

.controlsCenter {
	grid-area: center;
	justify-content: center;
}

.controlsTime {
	font-size: 90%;
}

.controlsVolume {
	grid-area: volume;

	.volumeSeekbar {
		display: none;
	}
}

.seekbar {
	grid-area: seekbar;
}
</style>
