<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<MkMediaList v-if="image" :mediaList="[image]" :class="$style.mediaList"/>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import MkMediaList from '@/components/MkMediaList.vue';

const props = defineProps<{
	block: Misskey.entities.PageBlock,
	page: Misskey.entities.Page,
}>();

const image = ref<Misskey.entities.DriveFile | null>(null);

onMounted(() => {
	image.value = props.page.attachedFiles.find(x => x.id === props.block.fileId) ?? null;
});
</script>

<style lang="scss" module>
.root {
	border: 1px solid var(--divider);
	border-radius: var(--radius);
	overflow: hidden;
}
.mediaList {
	// MkMediaList 内の上部マージン 4px
	margin-top: -4px;
	height: calc(100% + 4px);
}
</style>
