<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.videoContainer, controlsShowing && $style.active]" @mouseover="onMouseOver" @mouseleave="onMouseLeave" @contextmenu.stop ref="playerEl">
	<button v-if="hide" :class="$style.hide" @click="hide = false">
		<div :class="$style.hideContent">
			<b v-if="video.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ defaultStore.state.dataSaver.media ? ` (${i18n.ts.video}${video.size ? ' ' + bytes(video.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ defaultStore.state.dataSaver.media && video.size ? bytes(video.size) : i18n.ts.video }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>
	<div v-else :class="$style.videoRoot" @click.self="onClick">
		<video
			ref="videoEl"
			:class="$style.video"
			:poster="video.thumbnailUrl ?? undefined"
			:title="video.comment ?? undefined"
			:alt="video.comment"
			preload="none"
			playsinline
		>
			<source
				:src="video.url"
			>
		</video>
		<button v-if="isReady && !isPlaying" class="_button" :class="$style.videoOverlayPlayButton" @click="onClick"><i class="ti ti-player-play-filled"></i></button>
		<div v-else-if="!isActuallyPlaying" :class="$style.videoLoading">
			<MkLoading/>
		</div>
		<div :class="$style.videoControls">
			<div :class="[$style.controlsChild, $style.controlsLeft]">
				<button class="_button" :class="$style.controlButton" @click="onClick">
					<i v-if="isPlaying" class="ti ti-player-pause-filled"></i>
					<i v-else class="ti ti-player-play-filled"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsRight]">
				<button class="_button" :class="$style.controlButton">
					<i class="ti ti-settings"></i>
				</button>
				<button class="_button" :class="$style.controlButton" @click="toggleFullscreen">
					<i v-if="isFullscreen" class="ti ti-arrows-minimize"></i>
					<i v-else class="ti ti-arrows-maximize"></i>
				</button>
			</div>
			<div :class="[$style.controlsChild, $style.controlsTime]">{{ hms(elapsedTimeMs) }}</div>
			<div :class="[$style.controlsChild, $style.controlsVolume]">
				<button class="_button" :class="$style.controlButton" @click="toggleMute">
					<i v-if="volume === 0" class="ti ti-volume-3"></i>
					<i v-else class="ti ti-volume"></i>
				</button>

			</div>
			<div :class="[$style.controlsChild, $style.controlsSeekbar]"></div>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, watch } from 'vue';
import * as Misskey from 'misskey-js';
import bytes from '@/filters/bytes.js';
import hms from '@/filters/hms.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { isFullscreenNotSupported } from '@/scripts/device-kind.js';
import hasAudio from '@/scripts/media-has-audio.js';

const props = defineProps<{
	video: Misskey.entities.DriveFile;
}>();

const hide = ref((defaultStore.state.nsfw === 'force' || defaultStore.state.dataSaver.media) ? true : (props.video.isSensitive && defaultStore.state.nsfw !== 'ignore'));

// MediaControl State
const videoEl = shallowRef<HTMLVideoElement>();
const playerEl = shallowRef<HTMLDivElement>();
const isHoverring = ref(false);
const oncePlayed = ref(false);
const controlsShowing = computed(() => {
	if (!oncePlayed.value) return true;
	if (isHoverring.value) return true;
	return false;
});
const isFullscreen = ref(false);

const isReady = ref(false);
const isPlaying = ref(false);
const isActuallyPlaying = ref(false);
const elapsedTimeMs = ref(0);
const volume = ref(.3);
const bufferedEnd = ref(0);
const bufferedDataRatio = computed(() => {
	if (!videoEl.value) return 0;
	return bufferedEnd.value / videoEl.value.duration;
});
let controlStateTimer;

// MediaControl Events
function onMouseOver(ev: MouseEvent) {
	if (controlStateTimer) {
		clearTimeout(controlStateTimer);
	}
	isHoverring.value = true;
}

function onMouseLeave(ev: MouseEvent) {
	controlStateTimer = setTimeout(() => {
		isHoverring.value = false;
	}, 100);
}

function onClick(ev: MouseEvent) {
	if (!isReady.value || !videoEl.value) return;

	if (isPlaying.value) {
		videoEl.value.pause();
		isPlaying.value = false;
	} else {
		videoEl.value.play();
		isPlaying.value = true;
		oncePlayed.value = true;
	}
}

function toggleFullscreen() {
	if (isFullscreenNotSupported && videoEl.value) {
		if (isFullscreen.value) {
			//@ts-ignore
			videoEl.value.webkitExitFullscreen();
			isFullscreen.value = false;
		} else {
			//@ts-ignore
			videoEl.value.webkitEnterFullscreen();
			isFullscreen.value = true;
		}
	} else if (playerEl.value) {
		if (isFullscreen.value) {
			document.exitFullscreen();
			isFullscreen.value = false;
		} else {
			playerEl.value.requestFullscreen({ navigationUI: 'hide' });
			isFullscreen.value = true;
		}
	}
}

function toggleMute() {
	if (volume.value === 0) {
		volume.value = .3;
	} else {
		volume.value = 0;
	}
}

const videoElWatcherStop = watch(videoEl, () => {
	if (videoEl.value) {
		videoElWatcherStop();

		isReady.value = true;

		function updateBufferedEnd() {
			if (videoEl.value) {
				try {
					bufferedEnd.value = videoEl.value.buffered.end(0);
				} catch(err) {
					// do nothing
				}
			}
			window.requestAnimationFrame(updateBufferedEnd);
		}
		updateBufferedEnd();

		videoEl.value.addEventListener('play', () => {
			isActuallyPlaying.value = true;
			isReady.value = true;
		});

		videoEl.value.addEventListener('pause', () => {
			isActuallyPlaying.value = false;
		});

		videoEl.value.addEventListener('timeupdate', () => {
			if (videoEl.value) {
				elapsedTimeMs.value = videoEl.value.currentTime * 1000;
			}
		});

		videoEl.value.volume = volume.value;
		hasAudio(videoEl.value).then(had => {
			if (!had && videoEl.value) {
				videoEl.value.loop = videoEl.value.muted = true;
				videoEl.value.play();
			}
		});
	}
});

watch(volume, (to) => {
	if (videoEl.value) videoEl.value.volume = to;
});
</script>

<style lang="scss" module>
.videoContainer {
	container-type: inline-size;
	position: relative;
}

.hide {
	width: 100%;
	background: none;
	border: none;
	outline: none;
  	font: inherit;
  	color: inherit;
	cursor: pointer;
	padding: 120px 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #000;
}

.hideContent {
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.videoRoot {
	background: #000;
	position: relative;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.video {
	display: block;
	height: 100%;
	width: 100%;
	pointer-events: none;
}

.videoOverlayPlayButton {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%,-50%);

	opacity: 0;
	transition: opacity .4s ease-in-out;

	background: var(--accent);
	color: #fff;
	padding: 1rem;
	border-radius: 99rem;

	font-size: 1.1rem;
}

.videoLoading {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.videoControls {
	display: grid;
	grid-template-areas:
		"left time . volume right"
		"seekbar seekbar seekbar seekbar seekbar";
	grid-template-columns: auto auto 1fr auto auto;
	align-items: center;
	gap: 4px;

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
	.videoControls {
		transform: translateY(0);
		opacity: 1;
		pointer-events: auto;
	}

	.videoOverlayPlayButton {
		opacity: 1;
	}
}

@container (min-width: 500px) {
	.videoControls {
		grid-template-areas: "left seekbar time volume right";
		grid-template-columns: auto 4fr auto 1fr auto;
	}
}

.controlsChild {
	display: flex;
	gap: 4px;
	color: #fff;

	.controlButton {
		padding: 6px;
		border-radius: calc(var(--radius) / 2);
		transition: background-color .2s ease-in-out;
		font-size: 1.05rem;

		&:hover {
			background-color: var(--accent);
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
}

.controlsVolume {
	grid-area: volume;
}

.controlsSeekbar {
	grid-area: seekbar;
}

</style>
