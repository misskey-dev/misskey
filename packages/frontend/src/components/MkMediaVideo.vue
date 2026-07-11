<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	tabindex="0"
	:class="[
		$style.videoContainer,
		(video.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive,
	]"
	@contextmenu.stop
	@keydown.stop
>
	<button v-if="hide" :class="$style.hidden" @click="reveal">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="video.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media ? ` (${i18n.ts.video}${video.size ? ' ' + bytes(video.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-movie"></i> {{ prefer.s.dataSaver.media && video.size ? bytes(video.size) : i18n.ts.video }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>

	<div v-else :class="$style.videoRoot">
		<video
			ref="videoEl"
			:class="$style.video"
			:poster="video.thumbnailUrl ?? undefined"
			:alt="video.comment"
			preload="metadata"
			playsinline
		>
			<source :src="video.url">
		</video>
		<i class="ti ti-player-play-filled"></i>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef, computed, watch, onDeactivated, onActivated, onMounted } from 'vue';
import * as Misskey from 'misskey-js';
import bytes from '@/filters/bytes.js';
import { hms } from '@/filters/hms.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';

const props = defineProps<{
	video: Misskey.entities.DriveFile;
}>();

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref(shouldHideFileByDefault(props.video));

async function reveal() {
	if (!(await canRevealFile(props.video))) {
		return;
	}

	hide.value = false;
}
</script>

<style lang="scss" module>
.videoContainer {
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
	/* Hardcode to black because either --MI_THEME-bg or --MI_THEME-fg makes it hard to read in dark/light mode */
	background-color: black;
	border-radius: 6px;
	color: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
	display: inline-block;
	font-weight: bold;
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
}

.videoOverlayPlayButton {
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
</style>
