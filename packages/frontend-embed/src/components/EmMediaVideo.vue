<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :href="href" target="_blank" :class="$style.root">
	<img v-if="!video.isSensitive && video.thumbnailUrl" :class="$style.thumbnail" :src="video.thumbnailUrl">
	<div :class="$style.videoOverlayPlayButton"><i class="ti ti-player-play-filled"></i></div>
</a>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';

defineProps<{
	video: Misskey.entities.DriveFile;
	href: string;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
	box-sizing: border-box;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: auto;
	aspect-ratio: 16 / 9;
	padding: var(--MI-margin);
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	background-color: #000;

	&:hover {
		text-decoration: none;
	}
}

.thumbnail {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.videoOverlayPlayButton {
	background: var(--MI_THEME-accent);
	color: #fff;
	padding: 1rem;
	border-radius: 99rem;

	font-size: 1rem;
	line-height: 1rem;

	&:focus-visible {
		outline: none;
	}
}
</style>
