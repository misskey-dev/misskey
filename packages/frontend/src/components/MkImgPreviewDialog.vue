<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="modal"
	:width="1800"
	:height="900"
	@close="close"
	@esc="close"
	@click="close"
>
	<template #header>{{ file.name }}</template>
	<div :class="$style.container">
		<img :src="file.url" :alt="file.comment ?? file.name" :class="$style.img"/>
	</div>
</MkModalWindow>
</template>
<script lang="ts" setup>
import { defineProps, ref } from 'vue';
import MkModalWindow from './MkModalWindow.vue';
import type * as Misskey from 'misskey-js';

defineProps<{
	file: Misskey.entities.DriveFile;
}>();

const modal = ref<typeof MkModalWindow | null>(null);

function close() {
	modal.value?.close();
}

</script>
<style lang="scss" module>
	.container {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;

		// backgroundの市松模様
		background-image: linear-gradient(45deg, #999 25%, transparent 25%, transparent 75%, #999 75%),
	  									linear-gradient(45deg, #999 25%, transparent 25%, transparent 75%, #999 75%);
		background-position: 0 0, 8px 8px;
		background-size: 16px 16px;
		background-color: #ccc;
	}

	.img {
		width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
</style>
