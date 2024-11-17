<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[hide ? $style.hidden : $style.visible]" @click="onclick">
	<a
		:title="image.name"
		:class="$style.imageContainer"
		:href="href ?? image.url"
		target="_blank"
		rel="noopener"
	>
		<ImgWithBlurhash
			:hash="image.blurhash"
			:src="hide ? null : url"
			:forceBlurhash="hide"
			:cover="hide || cover"
			:alt="image.comment || image.name"
			:title="image.comment || image.name"
			:width="image.properties.width"
			:height="image.properties.height"
			:style="hide ? 'filter: brightness(0.7);' : null"
		/>
	</a>
	<template v-if="hide">
		<div :class="$style.hiddenText">
			<div :class="$style.hiddenTextWrapper">
				<b v-if="image.isSensitive" style="display: block;"><i class="ti ti-eye-exclamation"></i> {{ i18n.ts.sensitive }}</b>
				<b v-else style="display: block;"><i class="ti ti-photo"></i> {{ i18n.ts.image }}</b>
				<span style="display: block;">{{ i18n.ts.clickToShow }}</span>
			</div>
		</div>
	</template>
	<div :class="$style.indicators">
		<div v-if="['image/gif', 'image/apng'].includes(image.type)" :class="$style.indicator">GIF</div>
		<div v-if="image.comment" :class="$style.indicator">ALT</div>
		<div v-if="image.isSensitive" :class="$style.indicator" style="color: var(--MI_THEME-warn);" :title="i18n.ts.sensitive"><i class="ti ti-eye-exclamation"></i></div>
	</div>
	<i v-if="!hide" class="ti ti-eye-off" :class="$style.hide" @click.stop="hide = true"></i>
</div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import * as Misskey from 'misskey-js';
import ImgWithBlurhash from '@/components/EmImgWithBlurhash.vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	image: Misskey.entities.DriveFile;
	href?: string;
	raw?: boolean;
	cover?: boolean;
}>(), {
	cover: false,
});

const hide = ref(props.image.isSensitive);

const url = computed(() => (props.raw)
	? props.image.url
	: props.image.thumbnailUrl,
);

async function onclick(ev: MouseEvent) {
	if (hide.value) {
		ev.stopPropagation();
		hide.value = false;
	}
}
</script>

<style lang="scss" module>
.hidden {
	position: relative;
}

.hiddenText {
	position: absolute;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	z-index: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	cursor: pointer;
}

.hide {
	display: block;
	position: absolute;
	border-radius: 6px;
	background-color: var(--MI_THEME-fg);
	color: var(--MI_THEME-accentLighten);
	font-size: 12px;
	opacity: .5;
	padding: 5px 8px;
	text-align: center;
	cursor: pointer;
	top: 12px;
	right: 12px;
}

.hiddenTextWrapper {
	display: table-cell;
	text-align: center;
	font-size: 0.8em;
	color: #fff;
}

.visible {
	position: relative;
	//box-shadow: 0 0 0 1px var(--MI_THEME-divider) inset;
	background: var(--MI_THEME-bg);
	background-size: 16px 16px;
}

html[data-color-scheme=dark] .visible {
	--c: rgb(255 255 255 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

html[data-color-scheme=light] .visible {
	--c: rgb(0 0 0 / 2%);
	background-image: linear-gradient(45deg, var(--c) 16.67%, var(--MI_THEME-bg) 16.67%, var(--MI_THEME-bg) 50%, var(--c) 50%, var(--c) 66.67%, var(--MI_THEME-bg) 66.67%, var(--MI_THEME-bg) 100%);
}

.imageContainer {
	display: block;
	overflow: hidden;
	width: 100%;
	height: 100%;
	background-position: center;
	background-size: contain;
	background-repeat: no-repeat;
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
	color: var(--MI_THEME-accentLighten);
	display: inline-block;
	font-weight: bold;
	font-size: 0.8em;
	padding: 2px 5px;
}
</style>
