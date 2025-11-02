<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :href="href" target="_blank" :class="$style.root">
	<div :class="$style.label">
		<template v-if="media.type.startsWith('audio')"><i class="ti ti-music"></i> {{ i18n.ts.audio }}</template>
		<template v-else><i class="ti ti-file"></i> {{ i18n.ts.file }}</template>
	</div>
	<div :class="$style.go">
		<i class="ti ti-chevron-right"></i>
	</div>
</a>
</template>

<script setup lang="ts">
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';

defineProps<{
	media: Misskey.entities.DriveFile;
	href: string;
}>();
</script>

<style lang="scss" module>
.root {
	box-sizing: border-box;
	display: flex;
	align-items: center;
	width: 100%;
	padding: var(--MI-margin);
	margin-top: 4px;
	border: 1px solid var(--MI_THEME-inputBorder);
	border-radius: var(--MI-radius);
	background-color: var(--MI_THEME-panel);
	transition: background-color .1s, border-color .1s;

	&:hover {
		text-decoration: none;
		border-color: var(--MI_THEME-inputBorderHover);
		background-color: var(--MI_THEME-buttonHoverBg);
	}
}

.label {
	font-size: .9em;
}

.go {
	margin-left: auto;
}
</style>
