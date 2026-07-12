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
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, inject, computed, watch, onBeforeUnmount } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { DI } from '@/di.js';
import { hms } from '@/filters/hms.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import hasAudio from '@/utility/media-has-audio.js';
import MkMediaRange from '@/components/MkMediaRange.vue';

const videoEl = inject(DI.mkLightboxItemVideoEl, shallowRef<HTMLVideoElement | null>(null));

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
		if (videoEl.value == null) return;
		videoEl.value.currentTime = to * durationMs.value / 1000;
	},
});
const volume = ref(.25);
const speed = ref(1);
const loop = ref(false); // TODO: ドライブファイルのフラグに置き換える
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	if (videoEl.value == null || videoEl.value.duration === 0) return 0;
	return bufferedEnd.value / videoEl.value.duration;
});

function togglePlayPause() {
	if (!isReady.value) return;

	if (isPlaying.value) {
		videoEl.value?.pause();
		isPlaying.value = false;
	} else {
		videoEl.value?.play();
		isPlaying.value = true;
		oncePlayed.value = true;
	}
}

function togglePictureInPicture() {
	if (window.document.pictureInPictureElement) {
		window.document.exitPictureInPicture();
	} else {
		videoEl.value?.requestPictureInPicture();
	}
}

function toggleMute() {
	if (volume.value === 0) {
		volume.value = .25;
	} else {
		volume.value = 0;
	}
}

let abortController: AbortController | null = null;
let mediaTickFrameId: number | null = null;

function init() {
	if (videoEl.value == null) return;

	isReady.value = true;
	abortController = new AbortController();

	function updateMediaTick() {
		if (videoEl.value == null) return;

		try {
			bufferedEnd.value = videoEl.value.buffered.end(0);
		} catch (err) {
			bufferedEnd.value = 0;
		}

		elapsedTimeMs.value = videoEl.value.currentTime * 1000;

		if (videoEl.value.loop !== loop.value) {
			loop.value = videoEl.value.loop;
		}

		if (videoEl.value.paused !== !isPlaying.value) {
			isPlaying.value = !videoEl.value.paused;
		}

		mediaTickFrameId = window.requestAnimationFrame(updateMediaTick);
	}

	updateMediaTick();

	videoEl.value.addEventListener('waiting', () => {
		isActuallyPlaying.value = false;
	}, { signal: abortController.signal });

	videoEl.value.addEventListener('playing', () => {
		isActuallyPlaying.value = true;
	}, { signal: abortController.signal });

	videoEl.value.addEventListener('pause', () => {
		isActuallyPlaying.value = false;
		isPlaying.value = false;
	}, { signal: abortController.signal });

	videoEl.value.addEventListener('ended', () => {
		oncePlayed.value = false;
		isActuallyPlaying.value = false;
		isPlaying.value = false;
	}, { signal: abortController.signal });

	durationMs.value = videoEl.value.duration * 1000;
	videoEl.value.addEventListener('durationchange', () => {
		durationMs.value = videoEl.value!.duration * 1000;
	}, { signal: abortController.signal });

	videoEl.value.volume = volume.value;
	hasAudio(videoEl.value).then(had => {
		if (!had) {
			videoEl.value!.loop = videoEl.value!.muted = true;
			videoEl.value!.play();
		}
	});
}

watch(volume, (to) => {
	if (videoEl.value == null) return;
	videoEl.value.volume = to;
});

watch(speed, (to) => {
	if (videoEl.value == null) return;
	videoEl.value.playbackRate = to;
});

watch(loop, (to) => {
	if (videoEl.value == null) return;
	videoEl.value.loop = to;
});

watch(videoEl, () => {
	if (abortController != null) {
		abortController.abort();
	}
	if (mediaTickFrameId != null) {
		window.cancelAnimationFrame(mediaTickFrameId);
	}
	init();
}, { immediate: true });

onBeforeUnmount(() => {
	if (mediaTickFrameId != null) {
		window.cancelAnimationFrame(mediaTickFrameId);
	}
});

defineExpose({
	isPlaying,
	isActuallyPlaying,
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

.controlButton {
	padding: 6px;
	border-radius: 4px;

	&:hover {
		background-color: var(--MI_THEME-accentedBg);
		color: var(--MI_THEME-accent);
	}

	&:focus-visible {
		outline: none;
	}
}

.controlsTime {
	font-size: 85%;
}

.seekbar {
	grid-area: seekbar;
}
</style>
