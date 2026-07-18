<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	tabindex="0"
	:class="[
		$style.root,
		(video.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive,
	]"
	@contextmenu.stop="onContextmenu"
	@keydown.stop
>
	<button v-if="hide" :class="$style.hidden" @click="reveal">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="video.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media ? ` (${i18n.ts.video}${video.size ? ' ' + bytes(video.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-movie"></i> {{ prefer.s.dataSaver.media && video.size ? bytes(video.size) : i18n.ts.video }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>

	<div v-else :class="$style.videoRoot" @click="emit('mediaClick', $event)">
		<img
			v-if="video.thumbnailUrl"
			:class="$style.video"
			:src="video.thumbnailUrl"
			:alt="video.comment ?? undefined"
		/>
		<video
			v-else
			:class="$style.video"
			:alt="video.comment"
			preload="metadata"
		>
			<source :src="video.url">
		</video>
		<div :class="$style.playIconWrapper">
			<div :class="$style.playIcon">
				<i class="ti ti-player-play"></i>
			</div>
		</div>
		<button :class="$style.menu" class="_button" @click.stop="showMenu"><i class="ti ti-dots" style="vertical-align: middle;"></i></button>
		<i class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import bytes from '@/filters/bytes.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { getFileMenu } from '@/utility/get-file-menu.js';
import { shouldHideFileByDefault, canRevealFile } from '@/utility/sensitive-file.js';

const props = defineProps<{
	video: Misskey.entities.DriveFile;
}>();

const emit = defineEmits<{
	(event: 'mediaClick', ev: PointerEvent): void;
}>();

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref(shouldHideFileByDefault(props.video));

async function reveal() {
	if (!(await canRevealFile(props.video))) {
		return;
	}

	hide.value = false;
}

function showMenu(ev: PointerEvent) {
	os.popupMenu(getFileMenu(props.video, (newHide) => { hide.value = newHide; }), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getFileMenu(props.video, (newHide) => { hide.value = newHide; }), ev);
}
</script>

<style lang="scss" module>
.root {
	container-type: inline-size;
	position: relative;
	overflow: clip;

	&:focus-visible {
		outline: none;
	}

	&:hover {
		.playIcon {
			scale: 1.2;
		}
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

.hidden {
	width: 100%;
	height: 100%;
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
	object-fit: contain;
}

.playIconWrapper {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: grid;
	place-items: center;
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

.menu {
	display: block;
	position: absolute;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: 9px 0 0 0;
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
	bottom: 0;
	right: 0;
}

.hide {
	display: block;
	position: absolute;
	background-color: rgba(0, 0, 0, 0.3);
	-webkit-backdrop-filter: var(--MI-blur, blur(15px));
	backdrop-filter: var(--MI-blur, blur(15px));
	border-radius: 0 0 0 9px;
	color: #fff;
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 0;
	right: 0;
}
</style>
