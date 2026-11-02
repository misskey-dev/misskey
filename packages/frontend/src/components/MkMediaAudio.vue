<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	ref="playerEl"
	:class="[
		$style.root,
		(audio.isSensitive && prefer.s.highlightSensitiveMedia) && $style.sensitive,
	]"
	@contextmenu.stop="onContextmenu"
>
	<button v-if="hide" :class="$style.hidden" @click="reveal">
		<div :class="$style.hiddenTextWrapper">
			<b v-if="audio.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}{{ prefer.s.dataSaver.media ? ` (${i18n.ts.audio}${audio.size ? ' ' + bytes(audio.size) : ''})` : '' }}</b>
			<b v-else style="display: block;"><i class="ti ti-music"></i> {{ prefer.s.dataSaver.media && audio.size ? bytes(audio.size) : i18n.ts.audio }}</b>
			<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
		</div>
	</button>
	<div
		v-else
		v-panel
		role="button"
		tabindex="0"
		:class="$style.audioRoot"
		@click="emit('mediaClick', $event)"
		@keydown.enter.prevent="emit('mediaClick', $event)"
		@keydown.space.prevent="emit('mediaClick', $event)"
	>
		<div :class="$style.audioRootSkelton"></div>
		<svg version="1.1" viewBox="0 0 2911.5 735.42" xmlns="http://www.w3.org/2000/svg" :class="$style.audioWave">
			<path d="m2852.4 363.63h-21.65v8.17h21.65zm29.53 0h-21.65v8.17h21.65zm29.53 0h-21.65v8.17h21.65z"/>
			<path d="m1966.5 371.8h-21.65v-8.17h21.65zm29.53-45.33h-21.65v82.48h21.65zm29.53-51.19h-21.65v184.86h21.65z"/>
			<path d="m2468.6 363.63h-21.65v8.17h21.65zm-29.53-158.13h-21.65v324.42h21.65zm-29.53-85.62h-21.65v495.67h21.65z"/>
			<path d="m2320.9 52.6h-21.65v630.22h21.65zm59.06 0h-21.65v630.22h21.65zm-29.53-52.6h-21.65v735.42h21.65v-735.41z"/>
			<path d="m2498.1 320.48h-21.65v94.47h21.65zm59.06-200.6h-21.65v495.67h21.65zm-29.53 114.98h-21.65v265.71h21.65z"/>
			<path d="m2084.7 234.86h-21.65v265.71h21.65zm29.53-89.29h-21.65v444.3h21.65zm-59.06 71.31h-21.65v301.67h21.65z"/>
			<path d="m2202.8 363.63h-21.65v8.17h21.65zm-59.06-139.94h-21.65v288.05h21.65zm29.53 87.58h-21.65v112.9h21.65z"/>
			<path d="m2645.7 262.99h-21.65v209.44h21.65zm-59.06-117.43h-21.65v444.3h21.65v-444.29zm29.53 149.23h-21.65v145.84h21.65z"/>
			<path d="m2704.8 262.99h-21.65v209.44h21.65zm-29.53-28.13h-21.65v265.71h21.65zm59.06 59.94h-21.65v145.84h21.65z"/>
			<path d="m2822.9 349.18h-21.65v37.07h21.65zm-29.53-28.7h-21.65v94.47h21.65zm-29.53-25.69h-21.65v145.84h21.65z"/>
			<path d="m2261.8 171.25h-21.65v392.92h21.65zm29.53-51.37h-21.65v495.67h21.65zm-59.06 174.92h-21.65v145.84h21.65z"/>
			<path d="m297.93 374.56h-22.45v-8.48h22.45zm30.61-8.48h-22.45v8.48h22.45zm30.61 0h-22.45v8.48h22.45z"/>
			<path d="m940.74 366.09h-22.45v8.48h22.45zm30.61 0h-22.45v8.48h22.45zm30.61 0h-22.45v8.48h22.45z"/>
			<path d="m512.2 366.09h-22.45v8.48h22.45zm30.61 0h-22.45v8.48h22.45zm-61.22-62.42h-22.44v133.32h22.44z"/>
			<path d="m573.42 366.09h-22.45v8.48h22.45zm30.61 0h-22.45v8.48h22.45zm30.61-62.42h-22.44v133.32h22.44z"/>
			<path d="m114.27 222.53h-22.44v295.59h22.44zm61.22 0h-22.44v295.59h22.44zm-30.61-39.7h-22.44v375h22.44v-375.01z"/>
			<path d="m818.29 222.53h-22.44v295.59h22.44zm-61.22-129.47h-22.44v554.53h22.44zm30.61-36.25h-22.44v627.03h22.44z"/>
			<path d="m22.44 20.55h-22.44v699.54h22.44zm30.61 36.25h-22.44v627.04h22.44v-627.03zm30.61 210.61h-22.44v205.82h22.44z"/>
			<path d="m267.31 303.66h-22.44v133.32h22.44zm-61.22-36.25h-22.44v205.82h22.44zm30.61 0h-22.44v205.82h22.44z"/>
			<path d="m389.75 303.66h-22.44v133.32h22.44zm30.61 0h-22.44v133.32h22.44zm30.61-36.25h-22.44v205.82h22.44z"/>
			<path d="m726.46 141.39h-22.44v457.86h22.44zm-30.61 41.43h-22.44v375h22.44zm-30.61 84.59h-22.44v205.82h22.44z"/>
			<path d="m910.12 222.53h-22.44v295.59h22.44zm-61.22-39.7h-22.44v375h22.44v-375.01zm30.61 84.59h-22.44v205.82h22.44z"/>
			<path d="m1286.3 524.19h-19.72v-307.49h19.72zm-30.59-388.64h-19.72v469.79h19.72zm-30.59-63.76h-19.72v597.32h19.72z"/>
			<path d="m1133.4 605.34h-19.72v-469.79h19.72zm30.59-533.55h-19.72v597.32h19.72zm30.59-49.85h-19.72v697.02h19.72z"/>
			<path d="m1500.5 469.7h-19.72v-198.51h19.72zm61.18-198.51h-19.72v198.51h19.72zm-30.59-26.66h-19.72v251.84h19.72z"/>
			<path d="m1408.7 605.34h-19.72v-469.79h19.72zm30.59-445.45h-19.72v421.1h19.72v-421.09zm30.59 141.44h-19.72v138.23h19.72z"/>
			<path d="m1653.4 415.21h-19.72v-89.53h19.72zm-61.18-113.88h-19.72v138.23h19.72zm30.59 0h-19.72v138.23h19.72z"/>
			<path d="m1775.8 415.21h-19.72v-89.53h19.72zm30.59-89.53h-19.72v89.53h19.72zm30.59-24.35h-19.72v138.23h19.72z"/>
			<path d="m1102.8 556.65h-19.72v-372.41h19.72zm-30.59-255.32h-19.72v138.23h19.72zm-30.59 64.89h-19.72v8.45h19.72z"/>
			<path d="m1347.5 415.21h-19.72v-89.53h19.72zm30.59-170.69h-19.72v251.84h19.72v-251.83zm-61.18 121.7h-19.72v8.45h19.72z"/>
			<path d="m1684 374.67h-19.72v-8.45h19.72zm30.59-8.45h-19.72v8.45h19.72zm30.59 0h-19.72v8.45h19.72z"/>
			<path d="m1867.6 415.21h-19.72v-89.53h19.72zm61.18-48.99h-19.72v8.45h19.72zm-30.59 0h-19.72v8.45h19.72z"/>
		</svg>
		<div :class="$style.audioText">
			<i class="ti ti-music"></i> {{ i18n.ts.audio }}
		</div>
		<div :class="$style.playIconWrapper">
			<div :class="$style.playIcon">
				<i class="ti ti-player-play"></i>
			</div>
		</div>
		<button :class="[$style.menu, $style.menuBottom]" class="_button" @click.stop="showMenu" @keydown.stop><i class="ti ti-dots" style="vertical-align: middle;" aria-hidden="true"></i></button>
		<button :class="[$style.menu, $style.menuTop]" class="_button" @click.stop="hide = true" @keydown.stop><i class="ti ti-eye-off" style="vertical-align: middle;" aria-hidden="true"></i></button>
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
	audio: Misskey.entities.DriveFile;
}>();

const emit = defineEmits<{
	(event: 'mediaClick', ev: PointerEvent | KeyboardEvent): void;
}>();

// eslint-disable-next-line vue/no-setup-props-reactivity-loss
const hide = ref(shouldHideFileByDefault(props.audio));

async function reveal() {
	if (!(await canRevealFile(props.audio))) {
		return;
	}

	hide.value = false;
}

function showMenu(ev: PointerEvent) {
	os.popupMenu(getFileMenu(props.audio, (newHide) => { hide.value = newHide; }), (ev.currentTarget ?? ev.target ?? undefined) as HTMLElement | undefined);
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu(getFileMenu(props.audio, (newHide) => { hide.value = newHide; }), ev);
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

.audioRoot {
	position: relative;
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.audioRootSkelton {
	position: relative;
	width: min(100cqw, calc(100cqh * 16 / 9));
	height: auto;
	aspect-ratio: 16 / 9;
	pointer-events: none;
}

.audioWave {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	fill: color(from var(--MI_THEME-fg) srgb r g b / 0.5);
}

.audioText {
	position: absolute;
	bottom: 12px;
	left: 12px;
	font-size: 0.85em;
	user-select: none;
	pointer-events: none;
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
	color: #fff;
	font-size: 0.8em;
	width: 28px;
	height: 28px;
	text-align: center;
}

.menuBottom {
	border-radius: 8px 0 8px 0;
	bottom: 0;
	right: 0;
}

.menuTop {
	border-radius: 0 8px 0 8px;
	top: 0;
	right: 0;
}
</style>
